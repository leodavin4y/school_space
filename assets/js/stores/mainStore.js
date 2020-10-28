import {observable, action, makeObservable} from 'mobx';

class main {

    constructor() {
        makeObservable(this);
    }

    @observable isMobile = false;

    @observable auth = null;

    @observable user = null;

    @observable userProfile = null;

    @action setIsMobile = (isMobile) => {
        this.isMobile = isMobile;
    };

    @action setAuth = auth => {
        this.auth = auth;
    };

    @action setUserProfile = profile => {
        this.userProfile = profile;
    };

    @action setUser = user => {
        this.user = user;
    };
}

const mainStore = new main();
export default mainStore;