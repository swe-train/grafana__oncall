import 'jest/matchMedia.ts';
import { createMemoryHistory } from 'history';
import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { Users } from './Users';
import { BrowserRouter, Router } from 'react-router-dom';

jest.mock('state/useStore', () => ({ useStore: jest.fn() }));

import { RootBaseStore } from 'state/rootBaseStore';
import { MockedUserStore } from './__mocks__/MockedUserStore';
import { users } from './__mocks__/users';
import { team } from './__mocks__/teams';
import { MockedTeamStore } from './__mocks__/MockedTeamStore';
jest.mock('models/base_store');

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

  function initStore() {
    const rootStoreInstance = new RootBaseStore();
    const userStore = new MockedUserStore(rootStoreInstance, users.count, users.results, users.results[0].pk);
    const teamStore = new MockedTeamStore(rootStoreInstance, team);

    rootStore = {
      userStore,
      teamStore,
    };
  }

  test('My Attempt', () => {
    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <Users
          history={historyMock as any}
          location={locationMock as any}
          match={matchMock as any}
          meta={locationMock as any}
          query={queryMock}
          store={rootStore}
        />
      </Router>
    );

    console.log(history.location.pathname);

    const viewMyProfileButton = screen.getByTestId<HTMLButtonElement>('view-my-profile');
    fireEvent.click(viewMyProfileButton);

    console.log(history.location.pathname);
  });
});
