import React from 'react';

import {
  Button,
  HorizontalGroup,
  VerticalGroup,
  IconButton,
  ToolbarButton,
  Icon,
  Modal,
  Dropdown,
  Menu,
  ButtonGroup,
  RadioButtonGroup,
} from '@grafana/ui';
import cn from 'classnames/bind';
import dayjs from 'dayjs';
import { observer } from 'mobx-react';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { PageErrorHandlingWrapper } from 'components/PageErrorHandlingWrapper/PageErrorHandlingWrapper';
import { PluginLink } from 'components/PluginLink/PluginLink';
import { RenderConditionally } from 'components/RenderConditionally/RenderConditionally';
import { ScheduleFilters } from 'components/ScheduleFilters/ScheduleFilters';
import { ScheduleFiltersType } from 'components/ScheduleFilters/ScheduleFilters.types';
import { ScheduleQuality } from 'components/ScheduleQuality/ScheduleQuality';
import { Text } from 'components/Text/Text';
import { WithConfirm } from 'components/WithConfirm/WithConfirm';
import { ShiftSwapForm } from 'containers/RotationForm/ShiftSwapForm';
import { Rotations } from 'containers/Rotations/Rotations';
import { findClosestUserEvent } from 'containers/Rotations/Rotations.helpers';
import { ScheduleFinal } from 'containers/Rotations/ScheduleFinal';
import { ScheduleOverrides } from 'containers/Rotations/ScheduleOverrides';
import { ScheduleForm } from 'containers/ScheduleForm/ScheduleForm';
import { ScheduleICalSettings } from 'containers/ScheduleIcalLink/ScheduleIcalLink';
import { UserTimezoneSelect } from 'containers/UserTimezoneSelect/UserTimezoneSelect';
import { UsersTimezones } from 'containers/UsersTimezones/UsersTimezones';
import { WithPermissionControlTooltip } from 'containers/WithPermissionControl/WithPermissionControlTooltip';
import { getLayersFromStore, getTotalDaysToDisplay } from 'models/schedule/schedule.helpers';
import { Event, Layer, Schedule, ScheduleType, ScheduleView, Shift, ShiftSwap } from 'models/schedule/schedule.types';
import { UserHelper } from 'models/user/user.helpers';
import { PageProps, WithStoreProps } from 'state/types';
import { withMobXProviderContext } from 'state/withStore';
import { scrollToElement } from 'utils/DOM';
import { isUserActionAllowed, UserActions } from 'utils/authorization/authorization';
import { PLUGIN_ROOT } from 'utils/consts';

import { getCalendarStartDate, getNewCalendarStartDate, getUTCString } from './Schedule.helpers';

import styles from './Schedule.module.css';

const cx = cn.bind(styles);

interface SchedulePageProps extends PageProps, WithStoreProps, RouteComponentProps<{ id: string }> {}

interface SchedulePageState {
  schedulePeriodType: string;
  renderType: string;
  shiftIdToShowRotationForm?: Shift['id'];
  layerPriorityToShowRotationForm: Layer['priority'];
  shiftIdToShowOverridesForm?: Shift['id'];
  shiftStartToShowOverrideForm?: dayjs.Dayjs;
  shiftEndToShowOverrideForm?: dayjs.Dayjs;
  isLoading: boolean;
  showEditForm: boolean;
  showScheduleICalSettings: boolean;
  lastUpdated: number;
  filters: ScheduleFiltersType;
  shiftSwapIdToShowForm?: ShiftSwap['id'] | 'new';
  shiftSwapParamsToShowForm?: Partial<ShiftSwap>;
}

@observer
class _SchedulePage extends React.Component<SchedulePageProps, SchedulePageState> {
  highlightMyShiftsWasToggled = false;
  scheduleId = this.props.match.params.id;

  constructor(props: SchedulePageProps) {
    super(props);

    this.state = {
      schedulePeriodType: 'week',
      renderType: 'timeline',
      shiftIdToShowRotationForm: undefined,
      layerPriorityToShowRotationForm: undefined,
      shiftIdToShowOverridesForm: undefined,
      isLoading: true,
      showEditForm: false,
      showScheduleICalSettings: false,
      lastUpdated: 0,
      filters: { users: [] },
    };
  }

  async componentDidMount() {
    const { store } = this.props;

    store.userStore.fetchItems();

    store.scheduleStore.updateFrequencyOptions();
    store.scheduleStore.updateDaysOptions();
    await store.scheduleStore.updateOncallShifts(this.scheduleId); // TODO we should know shifts to render Rotations
    await store.scheduleStore.refreshEvents(this.scheduleId);

    this.setState({ isLoading: false });
  }

  componentWillUnmount() {
    const { store } = this.props;
    store.scheduleStore.clearPreview();
    store.setPageTitle(undefined);
  }

  render() {
    const {
      store,
      query,
      match: {
        params: { id: scheduleId },
      },
    } = this.props;

    const {
      shiftIdToShowRotationForm,
      layerPriorityToShowRotationForm,
      shiftIdToShowOverridesForm,
      showEditForm,
      showScheduleICalSettings,
      shiftStartToShowOverrideForm,
      shiftEndToShowOverrideForm,
      filters,
      shiftSwapIdToShowForm,
      shiftSwapParamsToShowForm,
    } = this.state;

    const { isNotFoundError } = store.scheduleStore.refreshEventsError;

    const { scheduleStore, timezoneStore } = store;

    const users = UserHelper.getSearchResult(store.userStore).results;
    const schedule = scheduleStore.items[scheduleId];

    const disabledRotationForm =
      !isUserActionAllowed(UserActions.SchedulesWrite) ||
      schedule?.type !== ScheduleType.API ||
      !!shiftIdToShowRotationForm ||
      shiftIdToShowOverridesForm ||
      shiftSwapIdToShowForm;

    const disabledOverrideForm =
      !isUserActionAllowed(UserActions.SchedulesWrite) ||
      !schedule?.enable_web_overrides ||
      !!shiftIdToShowOverridesForm ||
      shiftIdToShowRotationForm ||
      shiftSwapIdToShowForm;

    const disabledShiftSwaps =
      !isUserActionAllowed(UserActions.SchedulesWrite) ||
      !!shiftIdToShowOverridesForm ||
      shiftIdToShowRotationForm ||
      shiftSwapIdToShowForm;

    const layers = getLayersFromStore(store, scheduleId, store.timezoneStore.calendarStartDate);
    const nextPriority = layers && layers.length ? layers[layers.length - 1].priority + 1 : 1;

    const { scheduleView } = scheduleStore;

    return (
      <PageErrorHandlingWrapper errorData={scheduleStore.refreshEventsError} objectName="schedule" pageName="schedules">
        {() => (
          <>
            <div className={cx('root')}>
              {isNotFoundError ? (
                <div className={cx('not-found')}>
                  <VerticalGroup spacing="lg" align="center">
                    <Text.Title level={1}>404</Text.Title>
                    <Text.Title level={4}>Schedule not found</Text.Title>
                    <PluginLink query={{ page: 'schedules', ...query }}>
                      <Button variant="secondary" icon="arrow-left" size="md">
                        Go to Schedules page
                      </Button>
                    </PluginLink>
                  </VerticalGroup>
                </div>
              ) : (
                <VerticalGroup spacing="lg">
                  <div className={cx('header')}>
                    <HorizontalGroup justify="space-between">
                      <div className={cx('title')}>
                        <PluginLink query={{ page: 'schedules', ...query }}>
                          <IconButton className="button-back" aria-label="Go Back" name="arrow-left" size="xl" />
                        </PluginLink>
                        <Text.Title
                          editable={false}
                          editModalTitle="Schedule name"
                          level={2}
                          onTextChange={this.handleNameChange}
                        >
                          {store.pageTitle}
                        </Text.Title>
                        {schedule && <ScheduleQuality schedule={schedule} />}
                      </div>
                      <HorizontalGroup spacing="lg">
                        {users && (
                          <HorizontalGroup>
                            <Text type="secondary">View in timezone:</Text>
                            <UserTimezoneSelect scheduleId={scheduleId} />
                          </HorizontalGroup>
                        )}
                        <HorizontalGroup>
                          <HorizontalGroup>
                            <HorizontalGroup>
                              <Button variant="secondary" onClick={this.handleExportClick()}>
                                Export
                              </Button>
                            </HorizontalGroup>

                            {(schedule?.type === ScheduleType.Ical || schedule?.type === ScheduleType.Calendar) && (
                              <WithPermissionControlTooltip userAction={UserActions.SchedulesWrite}>
                                <Button variant="secondary" onClick={this.handleReloadClick(scheduleId)}>
                                  Reload
                                </Button>
                              </WithPermissionControlTooltip>
                            )}
                            <Dropdown
                              overlay={
                                <Menu>
                                  {layers?.map((layer, index) => (
                                    <Menu.Item
                                      key={index}
                                      label={`L${layer.priority} rotation`}
                                      onClick={() => {
                                        scrollToElement(document.getElementById('rotations'));

                                        this.handleShowRotationForm('new', layer.priority);
                                      }}
                                    />
                                  ))}
                                  <Menu.Item
                                    label="New layer with rotation"
                                    onClick={() => {
                                      scrollToElement(document.getElementById('rotations'));

                                      this.handleShowRotationForm('new', nextPriority);
                                    }}
                                  />
                                  <Menu.Item
                                    label="Shift swap request"
                                    onClick={() => {
                                      this.handleShowShiftSwapForm('new');
                                    }}
                                  />
                                  <Menu.Item
                                    label="Override"
                                    onClick={() => {
                                      scrollToElement(document.getElementById('overrides-list'));

                                      this.handleShowOverridesForm('new');
                                    }}
                                  />
                                </Menu>
                              }
                            >
                              <ButtonGroup>
                                <Button>Add</Button>
                                <Button icon="angle-down" />
                              </ButtonGroup>
                            </Dropdown>
                          </HorizontalGroup>
                          <ToolbarButton
                            icon="cog"
                            tooltip="Settings"
                            onClick={() => {
                              this.setState({ showEditForm: true });
                            }}
                          />
                          <WithConfirm>
                            <ToolbarButton icon="trash-alt" tooltip="Delete" onClick={this.handleDelete} />
                          </WithConfirm>
                        </HorizontalGroup>
                      </HorizontalGroup>
                    </HorizontalGroup>
                  </div>
                  <div className={cx('users-timezones')}>
                    <UsersTimezones
                      scheduleId={scheduleId}
                      onCallNow={schedule?.on_call_now || []}
                      userIds={
                        scheduleStore.relatedUsers[scheduleId]
                          ? Object.keys(scheduleStore.relatedUsers[scheduleId])
                          : []
                      }
                    />
                  </div>

                  <div className={cx('rotations')}>
                    <div className={cx('controls')}>
                      <HorizontalGroup justify="space-between">
                        <HorizontalGroup>
                          <Button variant="secondary" onClick={this.handleTodayClick}>
                            Today
                          </Button>
                          <HorizontalGroup spacing="xs">
                            <Button variant="secondary" onClick={this.handleLeftClick}>
                              <Icon name="angle-left" />
                            </Button>
                            <Button variant="secondary" onClick={this.handleRightClick}>
                              <Icon name="angle-right" />
                            </Button>
                          </HorizontalGroup>
                          <Text.Title style={{ marginLeft: '8px', whiteSpace: 'nowrap' }} level={4} type="primary">
                            {store.timezoneStore.calendarStartDate.format('DD MMM')} -{' '}
                            {store.timezoneStore.calendarStartDate
                              .add(
                                getTotalDaysToDisplay(scheduleStore.scheduleView, timezoneStore.calendarStartDate) - 1,
                                'day'
                              )
                              .format('DD MMM')}
                          </Text.Title>
                        </HorizontalGroup>
                        <HorizontalGroup>
                          <RadioButtonGroup
                            options={[
                              { label: ScheduleView.OneWeek, value: ScheduleView.OneWeek },
                              { label: ScheduleView.TwoWeeks, value: ScheduleView.TwoWeeks },
                              { label: ScheduleView.OneMonth, value: ScheduleView.OneMonth },
                            ]}
                            value={scheduleView}
                            onChange={(value) => {
                              scheduleStore.setScheduleView(value);
                              if (value === ScheduleView.OneMonth) {
                                timezoneStore.setCalendarStartDate(
                                  getCalendarStartDate(
                                    timezoneStore.calendarStartDate.endOf('isoWeek').startOf('month'),
                                    value
                                  )
                                );
                              }

                              scheduleStore.refreshEvents(scheduleId);
                            }}
                          />
                          <ScheduleFilters
                            value={filters}
                            onChange={(value) => this.setState({ filters: value })}
                            currentUserPk={store.userStore.currentUserPk}
                          />
                        </HorizontalGroup>
                      </HorizontalGroup>
                    </div>
                    <ScheduleFinal
                      scheduleId={scheduleId}
                      disabled={disabledRotationForm}
                      onShowOverrideForm={this.handleShowOverridesForm}
                      filters={filters}
                      onShowShiftSwapForm={!shiftSwapIdToShowForm ? this.handleShowShiftSwapForm : undefined}
                      onSlotClick={
                        shiftSwapIdToShowForm
                          ? this.adjustShiftSwapForm
                          : (event: Event) => {
                              const shiftId = event.shift.pk;

                              if (event.shift.type === 2 && !disabledRotationForm) {
                                this.handleShowRotationForm(shiftId);
                              } else if (event.shift.type === 3 && !disabledOverrideForm) {
                                this.handleShowOverridesForm(shiftId);
                              }
                            }
                      }
                    />
                    <RenderConditionally shouldRender={scheduleView !== ScheduleView.OneMonth}>
                      <Rotations
                        scheduleId={scheduleId}
                        onCreate={this.refreshEventsAndClearPreview}
                        onUpdate={this.refreshEventsAndClearPreview}
                        onDelete={this.refreshEventsAndClearPreview}
                        shiftIdToShowRotationForm={shiftIdToShowRotationForm}
                        layerPriorityToShowRotationForm={layerPriorityToShowRotationForm}
                        onShowRotationForm={this.handleShowRotationForm}
                        onShowOverrideForm={this.handleShowOverridesForm}
                        disabled={disabledRotationForm}
                        filters={filters}
                        onShowShiftSwapForm={!shiftSwapIdToShowForm ? this.handleShowShiftSwapForm : undefined}
                        onSlotClick={shiftSwapIdToShowForm ? this.adjustShiftSwapForm : undefined}
                      />
                    </RenderConditionally>
                    <RenderConditionally shouldRender={scheduleView !== ScheduleView.OneMonth}>
                      <ScheduleOverrides
                        scheduleId={scheduleId}
                        onCreate={this.refreshEventsAndClearPreview}
                        onUpdate={this.refreshEventsAndClearPreview}
                        onDelete={this.refreshEventsAndClearPreview}
                        shiftIdToShowRotationForm={shiftIdToShowOverridesForm}
                        onShowRotationForm={this.handleShowOverridesForm}
                        disabled={disabledOverrideForm}
                        disableShiftSwaps={disabledShiftSwaps}
                        shiftStartToShowOverrideForm={shiftStartToShowOverrideForm}
                        shiftEndToShowOverrideForm={shiftEndToShowOverrideForm}
                        onShowShiftSwapForm={!shiftSwapIdToShowForm ? this.handleShowShiftSwapForm : undefined}
                        filters={filters}
                      />
                    </RenderConditionally>
                  </div>
                </VerticalGroup>
              )}
            </div>
            {showEditForm && schedule && (
              <ScheduleForm
                id={scheduleId}
                onSubmit={this.update}
                onHide={() => {
                  this.setState({ showEditForm: false });
                }}
              />
            )}
            {showScheduleICalSettings && (
              <Modal
                isOpen
                title="Schedule export"
                closeOnEscape
                onDismiss={() => this.setState({ showScheduleICalSettings: false })}
              >
                <ScheduleICalSettings id={scheduleId} />
              </Modal>
            )}
            {shiftSwapIdToShowForm && (
              <ShiftSwapForm
                id={shiftSwapIdToShowForm}
                scheduleId={scheduleId}
                params={shiftSwapParamsToShowForm}
                onHide={this.handleHideShiftSwapForm}
                onUpdate={this.refreshEventsAndClearPreview}
              />
            )}
          </>
        )}
      </PageErrorHandlingWrapper>
    );
  }

  update = async () => {
    const {
      store,
      match: {
        params: { id: scheduleId },
      },
    } = this.props;

    const { scheduleStore } = store;

    const schedule = await scheduleStore.loadItem(scheduleId);
    store.setPageTitle(schedule?.name);
  };

  handleShowRotationForm = (shiftId: Shift['id'] | 'new', layerPriority?: Layer['priority']) => {
    this.setState({ shiftIdToShowRotationForm: shiftId, layerPriorityToShowRotationForm: layerPriority });
  };

  handleShowOverridesForm = (shiftId: Shift['id'] | 'new', shiftStart?: dayjs.Dayjs, shiftEnd?: dayjs.Dayjs) => {
    this.setState({
      shiftIdToShowOverridesForm: shiftId,
      shiftStartToShowOverrideForm: shiftStart,
      shiftEndToShowOverrideForm: shiftEnd,
    });
  };

  handleNameChange = async (value: string) => {
    const {
      store,
      match: {
        params: { id: scheduleId },
      },
    } = this.props;

    const schedule = store.scheduleStore.items[scheduleId];

    await store.scheduleStore.update(scheduleId, { type: schedule.type, name: value });
    const loadedSchedule = await store.scheduleStore.loadItem(scheduleId);
    store.setPageTitle(loadedSchedule?.name);
  };

  refreshEventsAndClearPreview = async () => {
    const { store } = this.props;

    await store.scheduleStore.refreshEvents(this.scheduleId);
    store.scheduleStore.clearPreview();
  };

  handleShedulePeriodTypeChange = (value: string) => {
    this.setState({ schedulePeriodType: value });
  };

  handleRenderTypeChange = (value: string) => {
    this.setState({ renderType: value });
  };

  handleDateRangeUpdate = async () => {
    await this.props.store.scheduleStore.refreshEvents(this.scheduleId);
    this.forceUpdate();
  };

  handleTodayClick = () => {
    const { store } = this.props;
    store.timezoneStore.setCalendarStartDate(
      getCalendarStartDate(store.timezoneStore.currentDateInSelectedTimezone, store.scheduleStore.scheduleView)
    );
    this.handleDateRangeUpdate();
  };

  handleLeftClick = () => {
    const { store } = this.props;
    const { scheduleStore, timezoneStore } = store;

    const newCalendarStartDate = getNewCalendarStartDate(
      timezoneStore.calendarStartDate,
      scheduleStore.scheduleView,
      'prev'
    );

    store.timezoneStore.setCalendarStartDate(newCalendarStartDate);
    this.handleDateRangeUpdate();
  };

  handleRightClick = () => {
    const { store } = this.props;
    const { scheduleStore, timezoneStore } = store;
    const newCalendarStartDate = getNewCalendarStartDate(
      timezoneStore.calendarStartDate,
      scheduleStore.scheduleView,
      'next'
    );

    store.timezoneStore.setCalendarStartDate(newCalendarStartDate);
    this.handleDateRangeUpdate();
  };

  handleExportClick = () => {
    return () => {
      this.setState({ showScheduleICalSettings: true });
    };
  };

  handleReloadClick = (scheduleId: Schedule['id']) => {
    const { store } = this.props;

    const { scheduleStore } = store;

    return async () => {
      await scheduleStore.reloadIcal(scheduleId);

      store.scheduleStore.updateOncallShifts(scheduleId);
      store.scheduleStore.refreshEvents(scheduleId);
    };
  };

  handleDelete = async () => {
    const {
      store,
      match: {
        params: { id },
      },
      history,
    } = this.props;

    await store.scheduleStore.delete(id);
    history.replace(`${PLUGIN_ROOT}/schedules`);
  };

  handleShowShiftSwapForm = (id: ShiftSwap['id'] | 'new') => {
    const {
      store,
      match: {
        params: { id: scheduleId },
      },
    } = this.props;

    const {
      userStore: { currentUserPk },
      timezoneStore: { currentDateInSelectedTimezone },
    } = store;

    const layers = getLayersFromStore(store, scheduleId, store.timezoneStore.calendarStartDate);

    const { filters } = this.state;

    const closestEvent = findClosestUserEvent(dayjs(), currentUserPk, layers);
    const swapStart = closestEvent
      ? dayjs(closestEvent.start)
      : currentDateInSelectedTimezone.startOf('day').add(1, 'day');

    const swapEnd = closestEvent ? dayjs(closestEvent.end) : swapStart.add(1, 'day');

    const params = {
      swap_start: getUTCString(swapStart),
      swap_end: getUTCString(swapEnd),
    };

    if (!filters.users.includes(currentUserPk)) {
      this.setState({ filters: { ...filters, users: [...this.state.filters.users, currentUserPk] } });
      this.highlightMyShiftsWasToggled = true;
    }

    this.setState({ shiftSwapIdToShowForm: id, shiftSwapParamsToShowForm: params });
  };

  handleHideShiftSwapForm = () => {
    const { filters } = this.state;

    const {
      store: { userStore },
    } = this.props;

    if (this.highlightMyShiftsWasToggled) {
      this.highlightMyShiftsWasToggled = false;
      const index = filters.users.indexOf(userStore.currentUserPk);

      if (index > -1) {
        const newUsers = [...filters.users];
        newUsers.splice(index, 1);

        this.setState({ filters: { ...filters, users: newUsers } });
      }
    }
    this.setState({ shiftSwapIdToShowForm: undefined, shiftSwapParamsToShowForm: undefined });
  };

  adjustShiftSwapForm = (event: Event) => {
    this.setState({
      shiftSwapParamsToShowForm: {
        ...this.state.shiftSwapParamsToShowForm,
        swap_start: event.start,
        swap_end: event.end,
      },
    });
  };
}

export const SchedulePage = withRouter(withMobXProviderContext(_SchedulePage));
