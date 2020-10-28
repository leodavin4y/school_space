import React from 'react';
import {
    Avatar,
    Button,
    Div,
    Group,
    PanelHeader,
    RichCell,
    Snackbar,
    Link,
    Caption,
    TabsItem, Tabs, ScreenSpinner
} from "@vkontakte/vkui";
import axios from 'axios';
import {inject, observer} from "mobx-react";
import mainStore from "../../stores/mainStore";
import moment from 'moment';
import PropTypes from 'prop-types';

const UserLink = (props) => {
    const style = props.style ?? {};

    return (
        <Link href={'https://vk.com/id' + props.uid} target="_blank" style={style}>
            {props.children}
        </Link>
    );
};

@inject("mainStore")
@observer
class OrdersPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: 'main',
            orders: [],
            snack: null
        };
    }

    snack = (text) => {
        this.setState({ snack:
            <Snackbar
                layout="vertical"
                onClose={() => this.setState({ snack: null })}
            >
                {text}
            </Snackbar>
        });
    };

    fetchOrders = () => {
        const {mainStore} = this.props;
        const type = this.state.activeTab === 'main' ? 'active' : 'processed';

        this.props.onPopout(<ScreenSpinner/>);

        axios.post(`/admin/orders/${type}/get`, {
            auth: mainStore.auth
        }).then(r => {
            const result = r.data;

            if (!result.status) throw new Error('Failed to fetch orders data');

            this.setState({
                orders: result.data.orders
            })
        }).catch(e => {
            this.snack('Не удалось получить данные о заказах');
        }).finally(() => {
            this.props.onPopout(null);
        })
    };

    completeOrder = (order) => {
        this.props.onPopout(<ScreenSpinner/>);

        axios.post(`/admin/orders/${order.id}/complete`, {
            auth: mainStore.auth
        }).then(r => {
            const result = r.data;

            if (!result.status) throw new Error('Failed to complete order');

            this.setState({
                orders: this.state.orders.filter(item => item.id !== order.id)
            });

            this.snack('Заказ помечен как обработанный');
        }).catch(e => {
            this.snack('Не удалось пометить заказ как обработанный');
        }).finally(() => {
            this.props.onPopout(null);
        })
    };

    tab = (name) => {
        this.setState({
            activeTab: name
        }, this.fetchOrders);
    };

    componentDidMount() {
        this.fetchOrders();
    }

    render() {
        return (
            <>
                <PanelHeader>
                    Заказы
                </PanelHeader>

                <Div>
                    <Tabs mode="buttons">
                        <TabsItem
                            onClick={() => {this.tab('main')}}
                            selected={this.state.activeTab === 'main'}
                        >
                            Новые
                        </TabsItem>
                        <TabsItem
                            onClick={() => {this.tab('history')}}
                            selected={this.state.activeTab === 'history'}
                        >
                            Обработанные
                        </TabsItem>
                    </Tabs>

                    {this.state.activeTab === 'main' &&
                        <Group>
                            {this.state.orders.map((order) =>
                                <RichCell
                                    key={order.id}
                                    before={
                                        <UserLink uid={order.user.user_id} style={{ marginRight: 5 }}>
                                            <Avatar size={48} src={order.user.photo_100} />
                                        </UserLink>
                                    }
                                    text={
                                        <UserLink uid={order.user.user_id}>
                                            <Caption level="1" weight="regular">{order.user.first_name} {order.user.last_name}</Caption>
                                        </UserLink>
                                    }
                                    after={<Button mode="secondary" onClick={() => {this.completeOrder(order)}}>Принять</Button>}
                                >
                                    <Caption level="1" weight="medium">
                                        Товар: {order.product.name} {order.promo_code ? ('Промокод: ' + order.promo_code.code) : ''}
                                    </Caption>
                                    <Caption level="2" weight="regular">
                                        {moment(order.created_at).format('HH:mm, DD-MM-YY')}
                                    </Caption>
                                </RichCell>
                            )}
                        </Group>
                    }

                    {this.state.activeTab === 'history' &&
                        <Group>
                            {this.state.orders.map((order) =>
                                <RichCell
                                    key={order.id}
                                    before={
                                        <UserLink uid={order.user.user_id} style={{ marginRight: 5 }}>
                                            <Avatar size={48} src={order.user.photo_100} />
                                        </UserLink>
                                    }
                                    text={
                                        <UserLink uid={order.user.user_id}>
                                            <Caption level="1" weight="regular">{order.user.first_name} {order.user.last_name}</Caption>
                                        </UserLink>
                                    }
                                >
                                    <Caption level="1" weight="medium">
                                        Товар: {order.product.name} {order.promo_code ? ('Промокод: ' + order.promo_code.code) : ''}
                                    </Caption>
                                    <Caption level="2" weight="regular">
                                        {moment(order.created_at).format('HH:mm, DD-MM-YY')}
                                    </Caption>
                                </RichCell>
                            )}
                        </Group>
                    }
                </Div>

                {this.state.snack}
            </>
        );
    }
}

OrdersPanel.propTypes = {
    onPopout: PropTypes.func
};

export default OrdersPanel;