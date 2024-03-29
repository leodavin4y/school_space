import React from 'react';
import {inject, observer} from "mobx-react";
import axios from "axios";
import {declOfNum} from "../utils";
import {Title, Div} from '@vkontakte/vkui';
import PropTypes from "prop-types";
import classNames from 'classnames';

const Item = (props) => {
    const prod = props.product;

    if (props.enabled && !prod.enabled) return null;

    return (
        <div className="Product__wrap">
            <Div>
                <div className="Product" onClick={() => props.onSelect(prod)}>
                    <div
                        className="Product__photo"
                        style={{
                            backgroundImage: 'url("' + (prod.photo ? prefix + '/upload/products/' + prod.photo : 'https://vk.com/images/camera_200.png?ava=1') + '")'
                        }}
                    />
                    <Title level="3" weight="medium" className="Product__name">
                        {prod.name}
                    </Title>
                    <div className="Product__price">
                        {prod.price} 💎 {declOfNum(prod.price, ['Умникоин', 'Умникоина', 'Умникоинов'])}
                    </div>
                </div>
            </Div>
        </div>
    );
};

function chunk(arr, chunkSize) {
    if (chunkSize <= 0) throw "Invalid chunk size";
    let R = [];
    for (var i=0,len=arr.length; i<len; i+=chunkSize)
        R.push(arr.slice(i,i+chunkSize));
    return R;
}

@inject('mainStore', 'shopStore')
@observer
class ShopSection extends React.Component {

    constructor(props) {
        super(props);

        this.state = {

        };
    }

    fetchProducts = () => {
        const props = this.props;
        const {shopStore, mainStore} = props;

        props.spinner(true);
        props.onRefetchProducts();

        axios({
            method: 'post',
            url: `${prefix}/api/products/get`,
            data: {
                enabled: props.enabled,
                auth: mainStore.auth
            }
        }).then(response => {
            shopStore.setProducts(response.data.data);
            shopStore.setStoreEnabled(props.enabled);
        }).finally(() => {
            props.spinner(false);
        })
    };

    productsFirstLoad = () => {
        const props = this.props;
        const {shopStore} = props;

        if (shopStore.storeInit && props.enabled === shopStore.storeEnabled) return true;

        this.fetchProducts();
        shopStore.setStoreInit(true);
    };

    componentDidMount() {
        this.productsFirstLoad();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.refetchProducts) this.fetchProducts();
    }

    render() {
        const { shopStore, mainStore } = this.props;
        const productsRow = chunk(shopStore.products, 2);

        return (
            <div className={classNames({ 'Store': true, 'mobile': mainStore.isMobile })}>
                {productsRow.map((row, index) =>
                    <div className={'row'} key={index}>
                        {row.map((prod) =>
                            <Item
                                product={prod}
                                enabled={this.props.enabled}
                                key={prod.id}
                                onSelect={this.props.onSelect}
                            />
                        )}
                    </div>
                )}
            </div>
        );
    }

}

ShopSection.propTypes = {
    onSelect: PropTypes.func,
};

ShopSection.defaultProps = {
    enabled: null,
    spinner: () => {},
    refetchProducts: false,
    onRefetchProducts: () => {}
};

export default ShopSection;