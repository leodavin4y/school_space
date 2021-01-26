import {observable, makeObservable, action} from 'mobx';

class shop {

    constructor() {
        makeObservable(this);
    }

    @observable storeInit = false;

    @observable storeEnabled = 1;

    @observable products = [];

    @observable counter = 0;

    @action setStoreInit = (init) => {
        this.storeInit = init;
    };

    @action setStoreEnabled = (enabled) => {
        this.storeEnabled = enabled;
    };

    @action setProducts = (products) => {
        this.products = products;
    };

    @action setCounter = (counter) => {
        this.counter = counter;
    };
}

const shopStore = new shop();
export default shopStore;