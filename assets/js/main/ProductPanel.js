import React from 'react';
import PropTypes from 'prop-types';
import {
    Div,
    Button,
    Text,
    Title,
    PanelHeaderButton,
    PanelHeaderBack,
    PanelHeader,
    Snackbar, Avatar
} from "@vkontakte/vkui";
import {Icon16Cancel} from "@vkontakte/icons";
import {declOfNum, emit} from "../utils";
import axios from 'axios';
import {inject, observer} from "mobx-react";
import classNames from "classnames";
import ImgCard from './ImgCard';
import Popup from "../components/popup/popup";
import '../../css/ProductPanel.css';

@inject("mainStore", "shopStore")
@observer
class ProductPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            snack: null,
            popup: false
        };
    }

    snack = (text) => {
        this.setState({ snack:
            <Snackbar
                layout="vertical"
                onClose={() => this.setState({ snack: null })}
                before={<Avatar size={24} style={{ background: 'var(--accent)' }}><Icon16Cancel fill="#fff" width={14} height={14} /></Avatar>}
            >
                {text}
            </Snackbar>
        });
    };

    buy = () => {
        if (this.props.mainStore.user.info.balance < this.props.product.price) {
            return this.popupShow();
        }

        const url = `${prefix}/api/products/${this.props.product.id}/buy`;
        const data = {auth: this.props.mainStore.auth};

        this.props.spinner(true);

        axios.post(url, data)
            .then(response => {
                const result = response.data;

                if (!result.status && 'msg' in result.data) {
                    this.snack(result.data.msg);
                    return false;
                }

                this.props.onPurchase(result.data.order);
                this.props.shopStore.setCounter(this.props.shopStore.counter + 1);

                const user = this.props.mainStore.user;
                user.info.balance = user.info.balance - this.props.product.price;

                this.props.mainStore.setUser(user);

                emit('open', {view: 'store', panel: 'success'});
            }).catch(e => {
                this.snack('Произошла ошибка')
            }).finally(() => {
                this.props.spinner(false)
            });
    };

    popupShow = () => {
        this.setState({
            popup: true
        })
    };

    popupClose = () => {
        this.setState({
            popup: false
        })
    };

    render() {
        const {product, mainStore} = this.props;

        if (!product) return null;

        const store = this.props.mainStore;

        return (
            <>
                <PanelHeader
                    addon={<PanelHeaderButton onClick={() => { window.history.back() }}>Назад</PanelHeaderButton>}
                    left={<PanelHeaderBack onClick={() => { window.history.back() }} />}
                >
                    Магазин
                </PanelHeader>

                <Div className="ProductView">
                    <Title level="1" weight="bold" style={{ marginBottom: 16 }}>{product.name}</Title>

                    <div style={{ overflow: 'hidden' }}>
                        {product.photo &&
                            <div className={classNames({"ImgCard": true, "mobile": mainStore.isMobile})}>
                                <div className="ImgCardImg" style={{ backgroundImage: 'url(' + prefix + '/upload/products/' + product.photo +')' }} />
                            </div>
                        }

                        {product.description &&
                            <Text weight="regular" dangerouslySetInnerHTML={{ __html: product.description }}/>
                        }
                    </div>

                    <Button mode="commerce" size="l" onClick={this.buy} style={{ marginTop: 15 }}>
                        Купить за {product.price} 💎 {declOfNum(product.price, ['Умникоин', 'Умникоина', 'Умникоинов'])}
                    </Button>
                </Div>

                {this.state.popup &&
                    <Popup onClose={this.popupClose}>
                        <Title level="1" weight="bold" style={{ fontSize: '1.3em', marginBottom: 16 }}>
                            Ученик, мало умникоинов
                        </Title>

                        <Text weight="regular" style={{ marginBottom: 16 }}>
                            У вас недостаточно умникоинов для покупки этого товара.
                            Присылайте свои школьные оценки и мы их обменяем на умникоины.
                        </Text>

                        <Text weight="semibold">
                            Сейчас у вас: {store.user.info.balance} 💎 {declOfNum(store.user.info.balance, ['Умникоин', 'Умникоина', 'Умникоинов'])}
                        </Text>
                    </Popup>
                }

                {this.state.snack}
            </>
        );
    }
}

ProductPanel.propTypes = {
    product: PropTypes.object,
    spinner: PropTypes.func,
    onPurchase: PropTypes.func
};

export default ProductPanel;