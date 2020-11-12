import React from "react";
import {Link, withRouter} from 'react-router-dom';
import {
    Panel, Root, View, Link as VKLink, Tabs, TabsItem,
    Button as VKButton, Card, Div, Title, Text, ScreenSpinner,
    PanelHeaderButton, PanelHeaderBack, PanelHeader, Counter
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

@inject("mainStore")
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
            storeActionsCounter: 0
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
            url: '/api/init',
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
                storeActionsCounter: data.store_actions_counter
            });
        }).catch(e => {
            const response = JSON.parse(e.request.response);

            if (response.code === 422 && /user not found/i.test(response.message)) {
                console.log('User not found');
            }
        })
    };

    fetchHistory = ({mainStore} = this.props) => {
        if (this.state.history.length > 0) return false;

        const userId = mainStore.user.info.user_id;

        axios.post(`/api/history/${userId}/get`, {
            auth: mainStore.auth,
        }).then(r => {
            const {status, data} = r.data;

            if (!status) throw new Error('Failed to fetch history');

            this.setState({ history: data })
        }).catch(e => {

        })
    };

    fetchCurrentUser = async () => {
        if (this.props.mainStore.userProfile) return false;

        const user = await this.props.this.bridgeGetUser();
        this.props.mainStore.setUserProfile(user);
    };

    componentDidMount() {
        this.fetchCurrentUser();
        this.fetchInitData();
    }

    profileModal = (modal = true, spinner = false) => {
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
                auth={this.props.this.auth}
            />
        );

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
                            <TabsItem
                                onClick={() => {this.tab('history')}}
                                selected={this.state.activeTab === 'history'}
                            >
                                История
                            </TabsItem>
                            <TabsItem
                                onClick={() => {this.tab('store')}}
                                selected={this.state.activeTab === 'store'}
                                after={
                                    <Counter size="s" style={{ background: 'var(--counter_prominent_background)' }}>
                                        {this.state.storeActionsCounter}
                                    </Counter>
                                }
                            >
                                Магазин
                            </TabsItem>
                        </Tabs>

                        {this.state.activeTab === 'main' &&
                           <MainSection topUsers={this.state.topUsers} />
                        }

                        {this.state.activeTab === 'history' &&
                            <HistorySection history={this.state.history} />
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