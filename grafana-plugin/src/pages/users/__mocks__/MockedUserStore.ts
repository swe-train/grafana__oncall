import BaseStore from 'models/base_store';
import { User } from 'models/user/user.types';
import { RootStore } from 'state';
import { users } from './users';

export class MockedUserStore extends BaseStore {
  searchResult: { count?: number; results?: Array<User['pk']> } = {};

  items: { [pk: string]: User } = {};

  itemsCurrentlyUpdating = {};

  notificationPolicies: any = {};

  notificationChoices: any = [];

  notifyByOptions: any = [];

  isTestCallInProgress = false;

  currentUserPk?: User['pk'];

  constructor(
    rootStore: RootStore,
    users: { count: number; results: User[] },
    currentUserPk: string,
    notificationPoliciesImportant: any,
    notificationPoliciesDefault: any,
    notifyByOptions: any[]
  ) {
    super(rootStore);

    this.currentUserPk = currentUserPk;

    this.items = {
      ...this.items,
      ...users.results.reduce(
        (acc: { [key: number]: User }, item: User) => ({
          ...acc,
          [item.pk]: {
            ...item,
            // timezone: getTimezone(item),
          },
        }),
        {}
      ),
    };

    this.notificationPolicies = {
      [currentUserPk]: [...notificationPoliciesDefault, ...notificationPoliciesImportant],
    };
    // this.notifyByOptions = notifyByOptions;

    this.searchResult = {
      count: users.count,
      results: users.results.map((item: User) => item.pk),
    };
  }

  get currentUser() {
    if (!this.currentUserPk) {
      return undefined;
    }
    return this.items[this.currentUserPk as User['pk']];
  }

  async loadCurrentUser() {
    this.currentUserPk = users.results[1].pk;
    // this.rootStore.currentTimezone = timezone;
  }

  async loadUser(userPk: User['pk']): Promise<User> {
    return users.results.find((u) => u.pk === userPk);
  }

  async updateItem(_userPk: User['pk']) {}

  async updateItems(_f: any = { searchTerm: '' }, _page = 1) {
    return Promise.resolve();
  }

  getSearchResult() {
    return {
      count: users.count,
      results: users.results,
    };
  }

  sendTelegramConfirmationCode = async (_userPk: User['pk']) => {
    return Promise.resolve({
      telegram_code: '',
      bot_link: '',
    });
  };

  unlinkSlack = async (_userPk: User['pk']) => {};

  unlinkTelegram = async (_userPk: User['pk']) => {};

  sendBackendConfirmationCode = (_userPk: User['pk'], _backend: string) => '';

  unlinkBackend = async (_userPk: User['pk'], _backend: string) => {};

  async createUser(data: any) {
    const user = await this.create(data);

    this.items = {
      ...this.items,
      [user.pk]: user,
    };

    return user;
  }

  async updateUser(_data: Partial<User>) {}

  async updateCurrentUser(_data: Partial<User>) {}

  async fetchVerificationCode(_userPk: User['pk'], _recaptchaToken: string) {
    return Promise.resolve();
  }

  async verifyPhone(_userPk: User['pk'], _token: string) {
    return Promise.resolve();
  }

  async forgetPhone(_userPk: User['pk']) {
    return Promise.resolve();
  }

  async updateNotificationPolicies(_id: User['pk']) {}

  async moveNotificationPolicyToPosition() {
    return Promise.resolve();
  }

  async addNotificationPolicy() {
    return Promise.resolve();
  }

  async updateNotificationPolicy() {}

  async deleteNotificationPolicy() {}

  async updateNotificationPolicyOptions() {}

  async updateNotifyByOptions() {}

  async makeTestCall(_userPk: User['pk']) {
    return Promise.resolve();
  }

  async getiCalLink(_userPk: User['pk']) {
    return Promise.resolve();
  }

  async createiCalLink(_userPk: User['pk']) {
    return Promise.resolve();
  }

  async deleteiCalLink(_userPk: User['pk']) {
    return Promise.resolve();
  }

  async checkUserAvailability(_userPk: User['pk']) {
    return Promise.resolve();
  }
}
