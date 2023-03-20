import 'jest/matchMedia.ts';
import React from 'react';

import { render, screen } from '@testing-library/react';

import { Users } from './Users';
import { BrowserRouter } from 'react-router-dom';

import { users } from './__mocks__/users';
import { UserStore } from 'models/user/user';
import { User } from 'models/user/user.types';
import { getTimezone } from 'models/user/user.helpers';
import { Provider } from 'mobx-react';

jest.mock('state/useStore', () => ({ useStore: jest.fn() }));
import { useStore } from 'state/useStore';
import { TeamStore } from 'models/team/team';

import { team } from 'models/team/__mocks__/team';
import { Team } from 'models/team/team.types';
import { AppFeature } from 'state/features';

jest.mock('utils/authorization', () => ({
  ...jest.requireActual('utils/authorization'),
  isUserActionAllowed: jest.fn().mockReturnValue(true),
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

const locationMock = {
  pathName: 'a/grafana-oncall-app/users',
  search: '',
};

const matchMock = {
  isExact: true,
  params: {},
  path: 'a/grafana-oncall-app/users',
  url: 'a/grafana-oncall-app/users',
};

const queryMock = {
  p: 1,
};

const historyMock = {
  push: jest.fn(),
  location: locationMock,
};

let rootStore;

describe('Users', () => {
  beforeEach(() => {
    initStore();
  });

  function initStore(currentUser: User = users.results[0]) {
    const teamStore: Partial<TeamStore> = {
      currentTeam: team,

      loadCurrentTeam: () => Promise.resolve(),
      // setCurrentTeam,
      // addTeam,
      // saveCurrentTeam,
      // justSaveCurrentTeam,
      // getTelegramVerificationCode,
      // unlinkTelegram,
      // getInvitationLink,
      // joinToTeam,
      // updateTeam,
    };

    const userStore: Partial<UserStore> = {
      items: users.results.reduce(
        (acc: { [key: number]: User }, item: User) => ({
          ...acc,
          [item.pk]: {
            ...item,
            timezone: getTimezone(item),
          },
        }),
        {}
      ),
      currentUser,
      loadCurrentUser: () => Promise.resolve(),
      loadUser: (userPk: User['pk']) => Promise.resolve(users.results.find((u) => u.pk === userPk)),
      updateItem: () => Promise.resolve(),
      updateItems: () => Promise.resolve(),
      getSearchResult: jest.fn().mockReturnValue({
        count: users.count,
        results: users.results,
      }),

      getiCalLink: () => Promise.reject(),

      //* Unmocked methods */
      // sendTelegramConfirmationCode,
      // unlinkSlack,
      // unlinkTelegram,
      // sendBackendConfirmationCode,
      // unlinkBackend,
      // createUser,
      // updateUser,
      // updateCurrentUser,
      // fetchVerificationCode,
      // verifyPhone,
      // forgetPhone,
      // updateNotificationPolicies
      // moveNotificationPolicyToPosition,
      // addNotificationPolicy,
      // updateNotificationPolicy,
      // deleteNotificationPolicy,
      // updateNotificationPolicyOptions,
      // updateNotifyByOptions,
      // makeTestCall,
      // createiCalLink,
      // deleteiCalLink,
      // checkUserAvailability
    };

    rootStore = {
      userStore,
      teamStore,
    };
  }

  test("It renders user's profile", () => {
    render(
      <BrowserRouter>
        <Users
          history={historyMock as any}
          location={locationMock as any}
          match={matchMock as any}
          meta={locationMock as any}
          query={queryMock}
          store={rootStore}
        />
      </BrowserRouter>
    );
    const userSettings = screen.queryByTestId<HTMLElement>('user-settings');
    expect(userSettings).toBeDefined();
  });

  test("'Add a Mobile App' link is disabled for Role = Viewer", () => {
    const viewer = users.results[1];
    initStore(viewer);

    const match = {
      ...matchMock,
      params: {
        id: viewer.pk,
      },
    };

    // @ts-ignore
    useStore.mockImplementation(() => ({
      userStore: rootStore.userStore,
      teamStore: rootStore.teamStore,
      hasFeature: (_feature: string | AppFeature) => false,
      updateFeatures: () => Promise.resolve(),
    }));

    render(
      <BrowserRouter>
        <Provider rootStore={rootStore}>
          <Users
            history={historyMock as any}
            location={locationMock as any}
            match={match as any}
            meta={locationMock as any}
            query={queryMock}
            store={rootStore}
          />
        </Provider>
      </BrowserRouter>
    );

    const mobileAppLink = screen.queryByTestId<HTMLElement>('add-mobile-app');

    expect(mobileAppLink).toBeDefined();
    screen.debug(mobileAppLink);
  });
});
