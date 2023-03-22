import 'jest/matchMedia.ts';
import { expectToBeDisabled, getAllByTestId, getByTestId, queryByTestId } from 'jest/utils';

import React from 'react';
import { createMemoryHistory } from 'history';
import { fireEvent, render } from '@testing-library/react';
import { Users } from './Users';
import { Route, Router } from 'react-router-dom';

import * as useStoreHelper from 'state/useStore';
import * as authorizationHelper from 'utils/authorization';

import { RootBaseStore } from 'state/rootBaseStore';
import { MockedUserStore } from './__mocks__/MockedUserStore';
import { users } from './__mocks__/users';
import { team } from './__mocks__/teams';
import { MockedTeamStore } from './__mocks__/MockedTeamStore';
import { act } from 'react-test-renderer';
import { NotificationPoliciesImportant, NotificationPoliciesDefault } from './__mocks__/notificationPolicies';
import { NotifyByOptions } from './__mocks__/notifyByOptions';

const queryMock = { p: 1 };
const userPaths = ['/a/grafana-oncall-app/users', '/a/grafana-oncall-app/users/:id'];

describe('Users', () => {
  let rootStore: any;

  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(authorizationHelper, 'isUserActionAllowed').mockReturnValue(true);

    initStore(users.results[0]);

    const mock = jest.spyOn(useStoreHelper, 'useStore');
    mock.mockImplementation(() => rootStore);
  });

  test('Clicking View My Profile button opens User Settings', () => {
    renderComponent();

    act(() => {
      const viewMyProfileButton = getByTestId('view-my-profile');
      fireEvent.click(viewMyProfileButton);

      const userSettings = getByTestId('user-settings');
      expect(userSettings).toBeDefined();
      const mobileAppTab = getByTestId('mobile-app-connection');
      expect(mobileAppTab).toBeDefined();
    });
  });

  test(`Viewer has links disabled on User Profile`, () => {
    jest.spyOn(MockedUserStore.prototype, 'getiCalLink').mockImplementationOnce(() => Promise.reject()); // First we spyOn (use Once!)
    initStore(users.results[1]); // Then we init Store. Otherwise it will most likely fail

    setIsUserActionAllowed(false);
    renderComponent();

    act(() => {
      fireEvent.click(getByTestId('view-my-profile'));
      const addMobileAppLink = getByTestId('add-mobile-app-link'); // Cannot view mobile screen
      expectToBeDisabled(addMobileAppLink);

      const createICalLink = getByTestId('create-ical-link'); // Cannot add an iCal
      expectToBeDisabled(createICalLink);

      const addNotificationStep = getAllByTestId('add-notification-step'); // Cannot add Notification
      addNotificationStep.every((step) => expectToBeDisabled(step));
    });
  });

  test('Viewer has no permission to view Mobile App Connection Tab', () => {
    setIsUserActionAllowed(false);
    renderComponent();

    act(() => {
      const viewMyProfileButton = getByTestId('view-my-profile');
      fireEvent.click(viewMyProfileButton);

      const mobileAppTab = queryByTestId('mobile-app-connection');
      expect(mobileAppTab).toBeNull();
    });
  });

  function renderComponent() {
    const history = createMemoryHistory({
      initialEntries: [userPaths[0]],
    });

    render(
      <Router history={history}>
        <Route path={userPaths} exact>
          <Users meta={{} as any} query={queryMock} store={rootStore} />
        </Route>
      </Router>
    );

    return history;
  }

  function setIsUserActionAllowed(value: boolean) {
    jest.spyOn(authorizationHelper, 'isUserActionAllowed').mockReturnValue(value);
  }

  function initStore(user) {
    const rootStoreInstance = new RootBaseStore();
    const userStore = new MockedUserStore(
      rootStoreInstance,
      users,
      user.pk,
      NotificationPoliciesImportant,
      NotificationPoliciesDefault,
      NotifyByOptions
    );
    const teamStore = new MockedTeamStore(rootStoreInstance, team);

    rootStore = {
      userStore,
      teamStore,
      hasFeature: jest.fn().mockReturnValue(false),
      updateFeatures: jest.fn(),
    };
  }
});

/*
 * MOCKED MODULES
 */

jest.mock('react-responsive', () => ({
  // ...jest.requireActual('react-responsive'),
  __esModule: true,
  default: (props) => <div>{props.children(true)}</div>,
  useMediaQuery: jest.fn().mockReturnValue(true),
}));

jest.mock('@grafana/runtime', () => ({
  config: {
    featureToggles: {
      topNav: false,
    },
  },
  locationService: {
    partial: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
  },
  getBackendSrv: () => ({
    get: jest.fn(),
    post: jest.fn(),
  }),
}));
