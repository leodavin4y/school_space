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
    TabsItem, Tabs, ScreenSpinner, IOS, ActionSheet, ActionSheetItem, withPlatform
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
            page: 1,
            snack: null,
            ajaxInProgress: false
        };
        this.scrollLocked = false;
    }

    ajaxProgress = (status) => {
        this.props.onPopout(status ? <ScreenSpinner /> : null);

        this.setState({
            ajaxInProgress: status,
        })
    };

    docBottomIsReached = () => {
        return document.body.offsetHeight + window.pageYOffset >= document.body.scrollHeight - 100;
    };

    scrollHandler = () => {
        if (!this.scrollLocked && this.docBottomIsReached()) {
            this.setState((state) => {
                return {
                    page: state.page + 1
                };
            }, () => {
                this.scrollLocked = true;
                this.fetchOrders();
            });
        }
    };

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

    showOption = (order) => {
        const PLATFORM = this.props.platform;
        const IS_IOS = PLATFORM === IOS;
        const {onPopout} = this.props;

        onPopout(
            <ActionSheet onClose={() => onPopout(null)}>
                <ActionSheetItem
                    autoclose
                    onClick={() => this.completeOrder(order)}
                >
                    Заказ обработан
                </ActionSheetItem>

                {IS_IOS && <ActionSheetItem autoclose mode="cancel">Выход</ActionSheetItem>}
            </ActionSheet>
        );
    };

    fetchOrders = () => {
        const {mainStore} = this.props;
        const type = this.state.activeTab === 'main' ? 'active' : 'processed';

        this.props.onPopout(<ScreenSpinner/>);

        axios.post(`${prefix}/admin/orders/${type}/get`, {
            page: this.state.page,
            auth: mainStore.auth
        }).then(r => {
            const result = r.data;

            if (!result.status) throw new Error('Failed to fetch orders data');

            this.setState({
                orders: [...this.state.orders, ...result.data.orders]
            });

            this.scrollLocked = false;
        }).catch(e => {
            this.snack('Не удалось получить данные о заказах');
        }).finally(() => {
            this.props.onPopout(null);
        })
    };

    completeOrder = (order) => {
        this.props.onPopout(<ScreenSpinner/>);

        axios.post(`${prefix}/admin/orders/${order.id}/complete`, {
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
            activeTab: name,
            orders: [],
            page: 1
        }, this.fetchOrders);
    };

    componentDidMount() {
        this.fetchOrders();

        window.addEventListener('scroll', this.scrollHandler);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.scrollHandler);
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
                            onClick={() => this.tab('main')}
                            selected={this.state.activeTab === 'main'}
                        >
                            Новые
                        </TabsItem>
                        <TabsItem
                            onClick={() => this.tab('history')}
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
                                    onClick={() => this.showOption(order)}
                                >
                                    <Caption level="1" weight="medium">
                                        {order.product.name}
                                    </Caption>
                                    <Caption level="2" weight="regular">
                                        {moment(order.created_at).format('HH:mm, DD-MM-YY')} {order.promo_code ? ('Промокод: ' + order.promo_code.code) : ''}
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
                                        {order.product.name}
                                    </Caption>
                                    <Caption level="2" weight="regular">
                                        {moment(order.created_at).format('HH:mm, DD-MM-YY')} {order.promo_code ? ('Промокод: ' + order.promo_code.code) : ''}
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

export default withPlatform(OrdersPanel);