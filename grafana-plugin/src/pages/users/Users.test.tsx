import 'jest/matchMedia.ts';
import { createMemoryHistory } from 'history';
import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { Users } from './Users';
import { Route, Router } from 'react-router-dom';

import * as useStoreHelper from 'state/useStore';

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

const queryMock = {
  p: 1,
};

let rootStore;

const userPaths = ['/a/grafana-oncall-app/users', '/a/grafana-oncall-app/users/:id'];

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
      hasFeature: jest.fn().mockReturnValue(false),
      updateFeatures: jest.fn(),
    };
  }

  test('My Attempt', () => {
    const history = createMemoryHistory({
      initialEntries: [userPaths[0]],
    });

    const mock = jest.spyOn(useStoreHelper, 'useStore');
    mock.mockImplementation(() => rootStore);

    render(
      <Router history={history}>
        <Route path={userPaths} exact>
          <Users meta={{} as any} query={queryMock} store={rootStore} />
        </Route>
      </Router>
    );

    const viewMyProfileButton = screen.getByTestId<HTMLButtonElement>('view-my-profile');
    fireEvent.click(viewMyProfileButton);
  });
});
