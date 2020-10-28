import {observable, makeObservable, action} from 'mobx';

class shop {

    constructor() {
        makeObservable(this);
    }

    @observable storeInit = false;

    @observable storeEnabled = 1;

    @observable products = [];

    @action setStoreInit = (init) => {
        this.storeInit = init;
    };

    @action setStoreEnabled = (enabled) => {
        this.storeEnabled = enabled;
    };

    @action setProducts = (products) => {
        this.products = products;
    };
}

const shopStore = new shop();
export default shopStore;