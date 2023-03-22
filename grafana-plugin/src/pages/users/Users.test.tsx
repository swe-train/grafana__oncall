import 'jest/matchMedia.ts';
import React from 'react';
import { createMemoryHistory } from 'history';
import { fireEvent, render, screen } from '@testing-library/react';
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

const queryMock = { p: 1 };
const userPaths = ['/a/grafana-oncall-app/users', '/a/grafana-oncall-app/users/:id'];

describe('Users', () => {
  let rootStore: any;

  beforeEach(() => {
    jest.resetModules();
    jest.spyOn(authorizationHelper, 'isUserActionAllowed').mockReturnValue(true);

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

  test('Clicking View My Profile button opens User Settings', () => {
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

    act(() => {
      const viewMyProfileButton = screen.getByTestId<HTMLButtonElement>('view-my-profile');
      fireEvent.click(viewMyProfileButton);

      const userSettings = screen.getByTestId<HTMLDivElement>('user-settings');
      expect(userSettings).toBeDefined();
    });
  });
});

/*
 * MOCKED MODULES
 */

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
