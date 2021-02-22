import React from 'react';
import {
    Button, FormLayout, Input, Div,
    Snackbar, PanelHeaderButton, PanelHeaderBack,
    PanelHeader, List, RichCell, Headline, Group, Header
} from "@vkontakte/vkui";
import {Notify} from '@happysanta/vk-app-ui';
import {inject, observer} from "mobx-react";
import axios from 'axios';
import PropTypes from 'prop-types';

@inject("mainStore")
@observer
class ProductPromoCodesPanel extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            promos: [],
            code: '',
            msg: '%имя%, ты открыл ... Выпал %промокод%',
            snack: null
        };
    }

    back = () => {window.history.back()};

    snack = (text) => {
        this.setState({
            snack: <Snackbar onClose={() => { this.setState({ snack: null }) }}>{text}</Snackbar>
        })
    };

    fetchPromos = ({product} = this.props) => {
        console.log(product);

        if (!product) return false;

        axios.post(`${prefix}/admin/products/${product.id}/promo-codes/get`, {
            auth: this.props.mainStore.auth
        }).then(r => {
            const result = r.data;

            if (!result.status) throw new Error('Fetching promo codes failed');

            this.setState({
                promos: result.data
            })
        }).catch(e => {
            this.snack('Не удалось загрузить промокоды');
        })
    };

    remove = (promo, {product} = this.props) => {
        axios.post(`${prefix}/admin/products/${product.id}/promo-codes/${promo.id}/delete`, {
            auth: this.props.mainStore.auth
        }).then(r => {
            if (!r.data.status) throw new Error('Failed to delete');

            const promos = [];

            this.state.promos.forEach(item => {
                if (item.id === promo.id) return false;
                promos.push(item);
            });

            this.setState({
                promos: promos
            });

            this.snack('Промокод успешно удалён');
        }).catch(e => {
            this.snack('Произошла ошибка');
        })
    };

    store = (e, {product} = this.props) => {
        const params = {
            code: this.state.code,
            msg: this.state.msg,
            auth: this.props.mainStore.auth
        };

        axios.post(`${prefix}/admin/products/${product.id}/promo-codes/store`, params)
            .then(({ data }) => {
                if (!data.status) throw new Error('Promo code store failed');

                this.setState({
                    code: '',
                    promos: [...this.state.promos, data.data.promo]
                });

                this.snack('Промокод успешно сохранен');
            }).catch(e => {
                this.snack('Произошла ошибка');
            })
    };

    code = (e) => {
        this.setState({ code: e.target.value })
    };

    msg = (e) => {
        this.setState({ msg: e.target.value })
    };

    componentDidMount() {
        this.fetchPromos();
    }

    render() {
        return (
            <>
                <PanelHeader
                    addon={<PanelHeaderButton onClick={this.back}>Назад</PanelHeaderButton>}
                    left={<PanelHeaderBack onClick={this.back} />}
                >
                    Промокоды
                </PanelHeader>

                {!this.props.product &&
                    <Div>
                        <Notify type="error">
                            <Headline weight="semibold">
                                Сначала необходимо создать товар, а затем добавлять к нему промокоды
                            </Headline>
                        </Notify>
                    </Div>
                }

                <FormLayout>
                    <Input
                        type="text"
                        top="Промокод"
                        placeholder="Промокод (Строка 32 симв.)"
                        value={this.state.code}
                        onChange={this.code}
                    />

                    <Input
                        type="text"
                        top="Сообщение после покупки"
                        placeholder="%имя%, ты открыл ... Выпал %промокод%"
                        value={this.state.msg}
                        onChange={this.msg}
                    />

                    <Button mode="primary" size="l" onClick={this.store}>Сохранить</Button>
                </FormLayout>

                <Group header={<Header mode="secondary">Список промокодов</Header>}>
                    <List>
                        {this.state.promos.map((promo) =>
                            <RichCell
                                key={promo.id}
                                after={
                                    <Button
                                        mode="secondary"
                                        onClick={() => { this.remove(promo) }}
                                    >
                                        Удалить
                                    </Button>
                                }
                            >
                                {promo.code}
                            </RichCell>
                        )}
                    </List>
                </Group>

                {this.state.snack}
            </>
        );
    }
}

ProductPromoCodesPanel.propTypes = {
    activePanel: PropTypes.string,
};

ProductPromoCodesPanel.defaultProps = {

};

export default ProductPromoCodesPanel;