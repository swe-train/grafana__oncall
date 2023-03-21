import BaseStore from 'models/base_store';
import { Team } from 'models/team/team.types';
import { RootStore } from 'state';

export class MockedTeamStore extends BaseStore {
  redirectingToProperTeam = false;

  currentTeam?: Team;

  constructor(rootStore: RootStore, currentTeam: Team) {
    super(rootStore);

    this.path = '/team/';
    this.currentTeam = currentTeam;
  }

  async loadCurrentTeam() {}

  async saveCurrentTeam(_data: any) {}
}
