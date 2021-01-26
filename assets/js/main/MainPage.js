import React from "react";
import {withRouter} from 'react-router-dom';
import {
    Panel, Root, View, Tabs, TabsItem,
    Button as VKButton, Div, Title, Text, ScreenSpinner,
    Counter,
} from "@vkontakte/vkui";
import axios from "axios";
import ProfileModal from "../getcoins/ProfileModal";
import {inject, observer} from "mobx-react";
import Header from './Header';
import MainSection from "./MainSection";
import HistorySection from './HistorySection';
import ShopSection from './ShopSection';
import ProductPanel from './ProductPanel';
import SuccessfulPurchasePanel from './SuccessfulPurchasePanel';
import Popup from '../components/popup/popup';

@inject("mainStore", "shopStore")
@observer
class MainPage extends React.Component {
    constructor(props) {
        super(props);

        this.focus = 0;
        this.state = {
            activeModal: null,
            activeTab: 'main',
            user: null,
            topUsers: [],
            page: 1,
            spinner: null,
            mainSpinner: null,
            storeSpinner: null,
            product: null,
            order: null,
            history: [],
            storeActionsCounter: 0,
            rightsPopup: null,
            rightsAllowed: false,
            initInProgress: true
        };
    }

    tab = (name) => {
        this.setState({
            activeTab: name
        });

        if (name === 'history') {
            this.fetchHistory();
        }
    };

    fetchInitData = async () => {
        axios({
            method: 'post',
            url: `${prefix}/api/init`,
            data: {
                auth: this.props.this.auth
            }
        }).then(async response => {
            const data = response.data.data;
            const {mainStore} = this.props;

            mainStore.setUser(data.user);

            this.setState({
                user: data.user,
                topUsers: data.top_users,
            });

            this.props.shopStore.setCounter(data.store_actions_counter);
        }).catch(e => {
            if (e.request && e.request.response) {
                const response = JSON.parse(e.request.response);

                if (response.code === 422 && /user not found/i.test(response.message)) {
                    console.log('User not found');
                }
            }
        }).finally(() => {
            this.setState({
                initInProgress: false
            })
        });
    };

    fetchHistory = ({mainStore} = this.props) => {};

    fetchCurrentUser = async () => {
        if (this.props.mainStore.userProfile) return false;

        const user = await this.props.this.bridgeGetUser();
        this.props.mainStore.setUserProfile(user);
    };

    componentDidMount() {
        this.fetchCurrentUser();
        this.fetchInitData();
    }

    rights = () => {
        return new Promise((resolve, reject) => {
            const close = () => {
                this.setState({ rightsPopup: null });
            };
            const onClose = () => {
                close();
                reject(false);
            };
            const allow = () => {
                close();
                resolve(true);
            };

            const profileGranted = window.localStorage ? window.localStorage.getItem('Profile_granted') : null;

            if (profileGranted === '1') return resolve(true);

            this.setState({
                rightsPopup:
                    <Popup onClose={onClose}>
                        <Title level="2" weight="semibold" style={{ marginBottom: 5, textTransform: 'uppercase' }}>
                            Запрос доступа
                        </Title>

                        <Text weight="regular" style={{ paddingTop: 16, paddingBottom: 16 }}>
                            Если вы желаете, чтобы данные о школе и городе были автоматически заполнены из вашего профиля,
                            подтвердите доступ к данным вашей страницы.
                        </Text>

                        <VKButton onClick={allow}>OK</VKButton>
                    </Popup>
            })
        })
    };

    profileModal = async (modal = true, spinner = false) => {
        const {user} = this.props.mainStore;
        const userInfoExist = user && user.info && user.info.city && user.info.school && user.info.class && user.info.teacher;

        if (modal && !userInfoExist) {
            const rights = await this.rights().catch(() => {return false;});

            this.setState({
                rightsAllowed: rights
            });
        }

        this.setState({
            activeModal: modal ? 'student_profile' : null,
            mainSpinner: spinner ? <ScreenSpinner /> : null
        });
    };

    onProductSelect = (product) => {
        const user = this.props.mainStore.user;

        if (!user || !user.info) {
            this.profileModal();
            return false;
        }

        this.setState({ product: product });
        this.props.open('store', 'product');
    };

    render() {
        const store = this.props.mainStore;
        const user = store.user;
        const modal = (
            <ProfileModal
                show={this.state.activeModal}
                onSending={() => { this.profileModal(false, true) }}
                onClose={() => { this.profileModal(false, false) }}
                rightsAllowed={this.state.rightsAllowed}
                auth={this.props.this.auth}
            />
        );
        const storeCounter = this.props.shopStore.counter > 0 ?
            <Counter
                onClick={() => {
                    this.props.open('store', 'history')
                }}
                style={{
                    background: 'var(--counter_prominent_background)',
                    cursor: 'pointer'
                }}
                size="s"
            >
                {this.props.shopStore.counter}
            </Counter> : null;

        return (
            <Root activeView={this.props.activeView}>
                <View id="view1" activePanel={this.props.activePanel} modal={modal} popout={this.state.mainSpinner}>
                    <Panel id="main">
                        <Header isAdmin={user && user.is_admin} onClick={this.profileModal} />

                        <Tabs mode="default">
                            <TabsItem
                                onClick={() => {this.tab('main')}}
                                selected={this.state.activeTab === 'main'}
                            >
                                Счёт
                            </TabsItem>
                            {/*<TabsItem
                                onClick={() => {this.tab('history')}}
                                selected={this.state.activeTab === 'history'}
                            >
                                История
                            </TabsItem>*/}
                            <TabsItem
                                onClick={() => {this.tab('store')}}
                                selected={this.state.activeTab === 'store'}
                                after={storeCounter}
                            >
                                Магазин
                            </TabsItem>
                        </Tabs>

                        {this.state.activeTab === 'main' &&
                           <MainSection initInProgress={this.state.initInProgress} topUsers={this.state.topUsers} />
                        }

                        {this.state.activeTab === 'history' &&
                            <Div>...</Div>
                        }

                        {this.state.activeTab === 'store' &&
                            <ShopSection
                                onSelect={this.onProductSelect}
                                spinner={
                                    seen => {
                                        this.setState({mainSpinner: seen ? <ScreenSpinner/> : null})
                                    }
                                }
                                enabled={true}
                            />
                        }

                        {this.state.rightsPopup}
                    </Panel>
                </View>

                <View id='store' activePanel={this.props.activePanel} popout={this.state.storeSpinner}>
                    <Panel id="product">
                        <ProductPanel
                            product={this.state.product}
                            spinner={
                                seen => {
                                    this.setState({storeSpinner: seen ? <ScreenSpinner/> : null})
                                }
                            }
                            onPurchase={
                                order => {
                                    this.setState({
                                        order: order
                                    })
                                }
                            }
                        />
                    </Panel>

                    <Panel id="success">
                        <SuccessfulPurchasePanel
                            product={this.state.product}
                            order={this.state.order}
                            onAlert={alert => {
                                this.setState({
                                    storeSpinner: alert
                                })
                            }}
                        />
                    </Panel>

                    <Panel id="history">
                        <HistorySection
                            spinner={
                                seen => {
                                    this.setState({storeSpinner: seen ? <ScreenSpinner/> : null})
                                }
                            }
                        />
                    </Panel>
                </View>

                {/*No internet placeholder*/}
                <View id='placeholder_view' activePanel={this.props.activePanel}>
                    <Panel id="internet">
                        {this.props.this.state.placeholder}
                    </Panel>
                </View>
            </Root>
        );
    }
}

export default withRouter(MainPage);