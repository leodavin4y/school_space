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
import {PageDialog} from "@happysanta/vk-app-ui";
import {declOfNum, emit} from "../utils";
import axios from 'axios';
import {inject, observer} from "mobx-react";
import classNames from "classnames";
import ImgCard from './ImgCard';

@inject("mainStore")
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

        const url = `/api/products/${this.props.product.id}/buy`;
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
        const {product} = this.props;

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
                    {product.photo &&
                        <ImgCard
                            src={'/upload/products/' + product.photo}
                            style={{ width: '100%', height: 200 }}
                        />
                    }

                    <Title level="1" weight="bold" style={{ marginBottom: 16 }}>{product.name}</Title>

                    {product.description &&
                        <Text weight="regular" style={{ marginBottom: 16 }}>{product.description}</Text>
                    }

                    <Button mode="commerce" size="l" onClick={this.buy}>
                        Купить за {product.price} 💎 {declOfNum(product.price, ['Умникоин', 'Умникоина', 'Умникоинов'])}
                    </Button>
                </Div>

                {this.state.popup &&
                    <PageDialog
                        onClose={this.popupClose}
                        className={classNames({
                            "PageDialog": true,
                            "PageDialog__window--fixed-width": true,
                            "PageDialog__window--mobile": store.isMobile
                        })}
                    >
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
                    </PageDialog>
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