import React from "react";
import {withRouter} from "react-router-dom";
import {
    Panel, PanelHeader, View, Epic, Tabbar,
    TabbarItem, Div, Button, Group,
    List, Cell, Header, Counter, ModalRoot, ModalCard
} from "@vkontakte/vkui";
import {
    Icon28Attachments, Icon28NewsfeedOutline, Icon28UserAddOutline,
    Icon28Settings, Icon28ArrowUturnRightOutline, Icon28UserOutline
} from '@vkontakte/icons';
import axios from "axios";
import bridge from '@vkontakte/vk-bridge';
import PointsReviewPanel from './PointsReviewPanel';
import NewProductPanel from './NewProductPanel';
import Users from "./Users";
import ProductsManage from './ProductsManage';
import ProductPromoCodesPanel from "./ProductPromoCodesPanel";
import OrdersPanel from "./OrdersPanel";
import ShowProfilePanel from './ShowProfilePanel';
import SettingsPanel from './SettingsPanel';

class DashboardPage extends React.Component {

    constructor(props) {
        super(props);

        this.width = document.documentElement.clientWidth;
        this.height = document.documentElement.clientHeight;
        this.syncId = 0;

        this.state = {
            activeView: 'view1',
            activePanel: 'main',
            activeWrap: 'main',
            ...this.props.this.state.loginData,
            windowSizeIsDefault: true,
            user: null,
            mainPopout: null,
            storePopout: null,
            ordersPopout: null,
            pointsPopout: null,
            product: null,
            pointsReviewModal: null,
            selectedUser: null
        };
    }

    componentDidMount() {
        this.getCurrentUser();
        this.syncStart();
    }

    componentWillUnmount() {
        this.syncStop();
    }

    getCurrentUser = () => {
        bridge.send("VKWebAppGetUserInfo")
            .then(data => {
                this.setState({ user: data });
            });
    };

    setWindowSize = (width = 0, height = 0) => {
        if (!bridge.supports("VKWebAppResizeWindow")) return false;

        if (width === 0 && height === 0) {
            const frameW = document.body.offsetWidth;
            const widthDiff = screen.width - frameW;
            const maxAdd = widthDiff / 2;
            width = frameW + maxAdd;

            const frameH = document.documentElement.clientHeight;
            height = frameH + ((screen.height - frameH) - 400);

            console.log('Frame h: ' + frameH, 'screen h:' + screen.height);
        }

        bridge.send("VKWebAppResizeWindow", {
            "width": width > 1000 ? 1000 : width,
            "height": height > 4000 ? 800 : height
        });

        this.setState((state, props) => ({
            windowSizeIsDefault: !state.windowSizeIsDefault
        }));
    };

    setDefaultWindowSize = () => {
        this.setWindowSize(this.width, this.height);
    };

    sync = () => {
        const params = new URLSearchParams();

        params.append('auth', this.props.this.auth);

        axios({
            method: 'post',
            url: '/admin/login',
            data: params
        }).then(response => {
            const {data} = response.data;

            this.setState({
                points_no_verify: data.points_no_verify,
                purchases: data.purchases
            });
        }).finally(this.syncStart);
    };

    syncStart = () => {
        this.syncId = setTimeout(this.sync, 30000);
    };

    syncStop = () => {
        clearTimeout(this.syncId);
        this.syncId = 0;
    };

    activeView = (name) => {
        this.setState({
            activeView: name
        });
    };

    pointsReviewShow = () => {
        this.syncStop();
        this.activeView('points_review');
    };

    showMain = () => {
        this.syncStart();
        this.activeView('main');
    };

    onStoryChange = (e) => {
        const view = e.currentTarget.dataset.story;

        this.props.open(view, 'main')
        // this.setState({ activeView: view });
    };

    logout = () => {
        this.props.open('view1', 'main');
        this.props.logout(() => {this.props.this.redirect("/")});
    };

    render() {
        const state = this.state;
        const CounterM = (props) => {
            return (<Counter style={{ marginRight: 10 }}>{props.children}</Counter>);
        };

        return (
            <>
                <Epic activeStory={this.props.activeView} tabbar={
                    <Tabbar>
                        <TabbarItem
                            onClick={this.onStoryChange}
                            selected={this.props.activeView === 'view1'}
                            data-story="view1"
                            text="Информация"
                        ><Icon28NewsfeedOutline /></TabbarItem>
                        <TabbarItem
                            onClick={this.onStoryChange}
                            selected={this.props.activeView === 'view2'}
                            data-story="view2"
                            text="Оценки"
                        ><Icon28Attachments/></TabbarItem>
                        <TabbarItem
                            onClick={this.onStoryChange}
                            selected={this.props.activeView === 'view3'}
                            data-story="view3"
                            text="Заказы"
                        ><Icon28UserAddOutline /></TabbarItem>
                        <TabbarItem
                            onClick={this.onStoryChange}
                            selected={this.props.activeView === 'view4'}
                            data-story="view4"
                            text="Товары"
                        ><Icon28Settings /></TabbarItem>
                        <TabbarItem
                            onClick={this.logout}
                            selected={this.props.activeView === 'view5'}
                            data-story="profile"
                            text="Выход"
                        ><Icon28ArrowUturnRightOutline /></TabbarItem>
                    </Tabbar>
                }>
                    <View id="view1" activePanel={this.props.activePanel} popout={this.state.mainPopout}>
                        <Panel id="main">
                            <PanelHeader>
                                Информация
                            </PanelHeader>

                            <Div style={{ clear: 'both', overflow: 'hidden' }}>
                                <Button
                                    mode="secondary"
                                    before={<Icon28UserOutline width={20} height={20} />}
                                    onClick={() => { this.props.open('view1', 'admins') }}
                                    style={{ display: 'block', float: 'left', marginRight: 15 }}
                                >
                                    Пользователи
                                </Button>

                                <Button
                                    mode="secondary"
                                    onClick={() => { this.props.open('view1', 'settings') }}
                                    style={{ display: 'block', float: 'left' }}
                                >
                                    Настройки
                                </Button>
                            </Div>

                            <Group header={<Header mode="secondary">Статистика</Header>}>
                                <List>
                                    <Cell before={<CounterM>{state.points_no_verify}</CounterM>}>Запросов на проверку оценок</Cell>
                                    <Cell before={<CounterM>{state.purchases}</CounterM>}>Новых заказов</Cell>
                                </List>
                            </Group>
                        </Panel>

                        <Panel id="admins">
                            <Users
                                serviceToken={this.state.service_token}
                                onPopout={popout => {
                                    this.setState({
                                        mainPopout: popout
                                    })
                                }}
                                onSelect={user => {
                                    this.setState({
                                        selectedUser: user
                                    })
                                }}
                                open={this.props.open}
                            />
                        </Panel>

                        <Panel id="show_profile">
                            <ShowProfilePanel user={this.state.selectedUser} />
                        </Panel>

                        <Panel id="settings">
                            <SettingsPanel />
                        </Panel>
                    </View>

                    <View
                        id="view2"
                        activePanel={this.props.activePanel}
                        popout={this.state.pointsPopout}
                        modal={
                            <ModalRoot
                                activeModal={this.state.activeModal}
                                onClose={() => {
                                    this.setState({
                                        activeModal: null
                                    })
                                }}
                            >
                                <ModalCard
                                    id="profile"
                                    onClose={() => {
                                        this.setState({
                                            activeModal: null
                                        })
                                    }}
                                >
                                    {this.state.pointsReviewModal}
                                </ModalCard>
                            </ModalRoot>
                        }
                    >
                        <Panel id="main">
                            <PointsReviewPanel
                                serviceToken={this.state.service_token}
                                onPopout={popout => {
                                    this.setState({
                                        pointsPopout: popout
                                    })
                                }}
                                onModal={content => {
                                    this.setState({
                                        activeModal: content ? "profile" : null,
                                        pointsReviewModal: content
                                    })
                                }}
                            />
                        </Panel>
                    </View>

                    <View id="view3" activePanel={this.props.activePanel} popout={this.state.ordersPopout}>
                        <Panel id="main">
                            <OrdersPanel
                                onPopout={
                                    popout => this.setState({ordersPopout: popout})
                                }
                            />
                        </Panel>
                    </View>

                    <View id="view4" activePanel={this.props.activePanel} popout={this.state.storePopout}>
                        <Panel id="main">
                            <ProductsManage
                                onAddProduct={() => {
                                    this.props.open('view4', 'new_product')
                                }}
                                onEdit={
                                    (prod) => {
                                        this.setState({ product: prod });
                                        this.props.open('view4', 'new_product');
                                    }
                                }
                                onPopout={
                                    popout => this.setState({storePopout: popout})
                                }
                            />
                        </Panel>

                        <Panel id="new_product">
                            <NewProductPanel
                                activePanel={this.state.activePanel}
                                product={this.state.product}
                                open={this.props.open}
                                onBack={() => {
                                    this.setState({ product: null })
                                }}
                                setProduct={(prod) => {
                                    this.setState({ product: prod })
                                }}
                            />
                        </Panel>

                        <Panel id="product_promo_codes">
                            <ProductPromoCodesPanel
                                product={this.state.product}
                            />
                        </Panel>
                    </View>
                </Epic>
            </>
        );
    }

}

export default withRouter(DashboardPage);