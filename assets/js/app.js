/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */

import '../css/app.css';
import 'core-js/es/map';
import 'core-js/es/set';
import React, {Suspense} from 'react';
import ReactDOM from "react-dom";
import {Route, Switch, Redirect, BrowserRouter as Router, useHistory, useLocation} from 'react-router-dom';
import bridge from '@vkontakte/vk-bridge';
import ConfigProvider from '@vkontakte/vkui/dist/components/ConfigProvider/ConfigProvider';
import {ScreenSpinner, Placeholder} from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';
import '@happysanta/vk-app-ui/dist/vkappui.css';
import MainPage from '../js/main/MainPage';
import Icon56WifiOutline from '@vkontakte/icons/dist/56/wifi_outline';
import axios from "axios";
import {inject, observer, Provider} from "mobx-react";
import {configure} from "mobx";
import mainStore from "./stores/mainStore";
import shopStore from './stores/shopStore';

// для IE11
require("es6-object-assign").polyfill();

const GetCoinsPage = React.lazy(() => import('../js/getcoins/GetCoinsPage'));
const StatsPage = React.lazy(() => import('../js/stats/StatsPage'));
const DashboardPage = React.lazy(() => import('../js/admin/dashboard/DashboardPage'));
const AdminLoginPage = React.lazy(() => import('../js/admin/login/AdminLoginPage'));
const NotFoundPage = React.lazy(() => import('../js/404/NotFoundPage'));
const parseAuthData = () => {
    const parser = new URLSearchParams(window.location.search);
    const result = {};

    parser.forEach((value, key) => {
        if (key.substr(0, 3) !== 'vk_') return false;
        result[key] = value;
    });

    result['sign'] = parser.has('sign') ? parser.get('sign') : '';

    return (result);
};
const auth = {
    isAuthenticated: false,
    authenticate(cb) {
        auth.isAuthenticated = true;
        cb();
    },
    signout(cb) {
        auth.isAuthenticated = false;
        cb();
    }
};

// A wrapper for <Route> that redirects to the login
// screen if you're not yet authenticated.
function PrivateRoute({ children, ...rest }) {
    return (
        <Route
            {...rest}
            render={({ location }) =>
                auth.isAuthenticated ? (
                    children
                ) : (
                    <Redirect to={{pathname: "/admin/login", state: { from: location }}}/>
                )
            }
        />
    );
}

function RouteStatus(props) {
    return (
        <Route
            render={({ staticContext }) => {
                // we have to check if staticContext exists
                // because it will be undefined if rendered through a BrowserRouter
                if (staticContext) {
                    staticContext.statusCode = props.statusCode;
                }

                return <div>{props.children}</div>;
            }}
        />
    );
}

function LoginButton() {
    let history = useHistory();
    let location = useLocation();
    let { from } = location.state || { from: { pathname: "/" } };
    let login = () => {
        auth.authenticate(() => {
            history.replace(from);
        });
    };

    return (
        <div>
            <p>You must log in to view the page at {from.pathname}</p>
            <button onClick={login}>Log in</button>
        </div>
    );
}

configure({ enforceActions: 'observed' });

@inject("mainStore")
@observer

class App extends React.Component {
    constructor(props) {
        super(props);

        const auth = parseAuthData();
        this.platform = 'vk_platform' in auth ? auth.vk_platform : null;
        this.mobile = this.platform && this.platform.indexOf('mobile') !== -1;
        this.auth = JSON.stringify(auth);
        props.mainStore.setIsMobile(this.mobile);
        props.mainStore.setAuth(this.auth);
        this.appMinified = false;
        this.state = {
            scheme: 'bright_light',
            lights: ['bright_light', 'client_light'],
            activeView: 'view1',
            activePanel: 'main',
            history: [
                {view: 'view1', panel: 'main'}
            ],
            viewHistory: [],
            panelHistory: [],
            redirect: null,
            placeholder: null,
            user: null,
            userProfile: null,
        };

        window._hsMobileUI = this.mobile;

        console.log('App created. Platform: ' + this.platform + '. Auth data: ' + this.auth);
    }

    goBack = () => {
        const history = this.state.history;

        // Если в массиве одно значение
        if (history.length === 0) {
            // Отправляем bridge на закрытие сервиса.
            bridge.send("VKWebAppClose", {"status": "success"});
        } else if (history.length > 1) {
            // Если в массиве больше одного значения
            // Удаляем последний элемент в массиве
            history.pop();
            // Изменяем массив с иторией и меняем активную панель.
            const hItem = history[history.length - 1];

            this.setState({
                activePanel: hItem.panel,
                activeView: hItem.view,
            })
        }
    };

    goToPage = (viewName, panelName) => {
        const hItem = {
            view: viewName,
            panel: panelName
        };

        window.history.pushState(hItem, panelName);

        this.setState({
            activeView: viewName,
            activePanel: panelName,
            history: [...this.state.history, hItem]
        });
    };

    colorScheme(scheme, needChange = false) {
        if (scheme === undefined) {
            scheme = this.state.lights[0];
            console.log('Текущая цветовая схема: Не задана. Схема по умолчанию - Светлая.');
        } else {
            console.log('Текущая цветовая схема: ' + scheme);
        }

        let isLight = this.state.lights.includes(scheme);

        if (needChange) {
            isLight = !isLight;
        }

        this.setState({ scheme: isLight ? 'bright_light' : 'space_gray' });

        bridge.send('VKWebAppSetViewSettings', {
            // тема для иконок статус-бара. Возможные варианты: light, dark.
            'status_bar_style': isLight ? 'dark' : 'light',
            // цвет экшн-бара. Возможные варианты: hex-код (#00ffff), none - прозрачный. Параметр работает только на Android.
            'action_bar_color': !isLight ? '#000' : '#ffff'
        });
    }

    redirect = (path) => {
        this.setState({
            redirect: <Redirect exact to={{pathname: path }}/>
        });
    };

    offlinePlaceholder = (show) => {
        const viewHistory = this.state.viewHistory;
        const panelHistory = this.state.panelHistory;

        if (show) {
            viewHistory.push(this.state.activeView);
            panelHistory.push(this.state.activePanel);

            this.setState({
                activeView: 'placeholder_view',
                activePanel: 'internet',
                viewHistory: viewHistory,
                panelHistory: panelHistory,
                placeholder: <Placeholder
                    stretched
                    icon={<Icon56WifiOutline/>}
                    header="Вы Offline"
                >
                    Нет связи с интернетом :(
                </Placeholder>
            })
        } else {
            const view = viewHistory.pop();
            const panel = panelHistory.pop();

            this.setState({
                activeView: view,
                activePanel: panel,
                viewHistory: viewHistory,
                panelHistory: panelHistory,
                placeholder: null
            })
        }
    };

    showPlaceholder = () => {
        if (this.state.placeholder) return false;

        const viewHistory = this.state.viewHistory;
        const panelHistory = this.state.panelHistory;

        viewHistory.push(this.state.activeView);
        panelHistory.push(this.state.activePanel);

        this.setState({
            activeView: 'placeholder_view',
            activePanel: 'internet',
            viewHistory: viewHistory,
            panelHistory: panelHistory,
            placeholder: <Placeholder
                stretched
                icon={<Icon56WifiOutline/>}
                header="Вы Offline"
            >
                Нет связи с интернетом :(
            </Placeholder>
        }, () => {
            // this.goToPage('placeholder_view', 'internet')
        })
    };

    hidePlaceholder = () => {
        if (!this.state.placeholder) return false;

        // window.history.back();
        const viewHistory = this.state.viewHistory;
        const panelHistory = this.state.panelHistory;
        const view = viewHistory.pop();
        const panel = panelHistory.pop();

        this.setState({
            activeView: view,
            activePanel: panel,
            viewHistory: viewHistory,
            panelHistory: panelHistory,
            placeholder: null
        })
    };

    bridgeGetUser = (userId = null) => {
        return bridge.send("VKWebAppGetUserInfo", userId ? {uid: parseInt(userId)} : {});
    };

    componentDidMount() {
        console.log('App mounted');

        const sub = () => {
            window.addEventListener('offline', this.showPlaceholder);
            window.addEventListener('online', this.hidePlaceholder);
        };

        const unsub = () => {
            window.removeEventListener('offline', this.showPlaceholder);
            window.removeEventListener('online', this.hidePlaceholder);
        };

        bridge.subscribe(({ detail: { type, data }}) => {
            if (type === 'VKWebAppUpdateConfig') { // Получаем тему клиента.
                this.colorScheme(data.scheme)
            }

            if (type === 'VKWebAppViewHide') {
                unsub();
            }

            if (type === 'VKWebAppViewRestore') {
                sub();
            }
        });

        window.addEventListener('popstate', this.goBack);

        sub();

        window.addEventListener('open', (e) => {
            const {view, panel} = e.detail;
            this.goToPage(view, panel);
        });
    }

    render() {
        return (
            <Router>
                <Suspense fallback={<ScreenSpinner />}>
                    <ConfigProvider isWebView={bridge.isWebView()} scheme={this.state.scheme}>
                        <Switch>
                            <Route exact path="/">
                                <MainPage
                                    activeView={this.state.activeView}
                                    activePanel={this.state.activePanel}
                                    mobile={this.mobile}
                                    open={this.goToPage}
                                    this={this}
                                />
                            </Route>

                            <Route exact path="/get-coins">
                                <GetCoinsPage
                                    activeView={this.state.activeView}
                                    activePanel={this.state.activePanel}
                                    mobile={this.mobile}
                                    open={this.goToPage}
                                    this={this}
                                />
                            </Route>

                            <Route exact path="/stats">
                                <StatsPage
                                    activeView={this.state.activeView}
                                    activePanel={this.state.activePanel}
                                    mobile={this.mobile}
                                    open={this.goToPage}
                                    this={this}
                                />
                            </Route>

                            <Route exact path="/admin/login">
                                <AdminLoginPage
                                    authenticate={auth.authenticate}
                                    signout={auth.signout}
                                    this={this}
                                />
                            </Route>

                            <PrivateRoute exact path="/admin/">
                                <DashboardPage
                                    activePanel={this.state.activePanel}
                                    activeView={this.state.activeView}
                                    this={this}
                                    open={this.goToPage}
                                    logout={auth.signout}
                                />
                            </PrivateRoute>

                            <Route>
                                <NotFoundPage
                                    activePanel={this.state.activePanel}
                                    activeView={this.state.activeView}
                                    open={this.goToPage}
                                />
                            </Route>
                        </Switch>

                        {this.state.redirect}
                    </ConfigProvider>
                </Suspense>
            </Router>
        );
    }
}

// Init VK  Mini App
bridge.send("VKWebAppInit");

const stores = {
    mainStore,
    shopStore
};

ReactDOM.render(
    <Provider {...stores}>
        <App />
    </Provider>,
    document.getElementById("root")
);

if (process.env.NODE_ENV === "development") {
    // import("eruda").then(({ default: eruda }) => {}); //runtime download
}