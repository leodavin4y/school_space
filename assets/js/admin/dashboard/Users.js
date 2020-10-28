import React from 'react';
import {
    Avatar,
    Button,
    Div,
    Group,
    PanelHeader,
    PanelHeaderBack,
    PanelHeaderButton,
    Snackbar, Tabs, TabsItem, Search,
    List, SimpleCell, FixedLayout,
    Separator, IOS,
    ActionSheet, ActionSheetItem, withPlatform,
    Counter, ScreenSpinner, HorizontalScroll
} from "@vkontakte/vkui";
import axios from "axios";
import {inject, observer} from "mobx-react";

@inject("mainStore")
@observer
class Users extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            activeTab: 'admins',
            users: [],
            search: '',
            page: 1,
            adminsCount: 0,
            usersCount: 0,
            bannedCount: 0,
            snack: null,
            ajaxInProgress: false
        };

        this.users = [];
        this.scrollLocked = false;
    }

    newAdminModal = async () => {
        try {
            const adminId = parseInt(prompt('Введите VK ID [цифры] нового администратора'));
            if (isNaN(adminId)) throw new Error('Wrong vk id');
            const response = await this.registerAdmin(adminId);
            this.snack(response ? 'Админ успешно добавлен' : 'Не удалось добавить');
        } catch (e) {}
    };

    registerAdmin = async adminId => {
        return axios({
            method: 'post',
            url: '/admin/register',
            data: {
                user_id: adminId,
                auth: this.props.mainStore.auth
            }
        }).then(response => {
            this.searchUsers();
            return response.data.status
        }).catch(e => {
            return false
        });
    };

    searchUsers = () => {
        const {search, page, activeTab} = this.state;
        const {mainStore, onPopout} = this.props;

        onPopout(<ScreenSpinner/>);

        axios.post(`/admin/${activeTab}/search`, {
            search: search,
            page: page,
            auth: mainStore.auth
        }).then(r => {
            const {status, data} = r.data;

            if (!status) throw new Error('Failed to search users');

            this.setState({
                users: activeTab === 'admins' ? data : [...this.state.users, ...data]
            });
        }).catch(e => {
            this.snack('Не удалось получить список пользователей');
        }).finally(() => {
            this.scrollLocked = false;
            onPopout(null);
        })
    };

    fetchUsersCount = () => {
        axios.post('/admin/users/count', {
            auth: this.props.mainStore.auth
        }).then(r => {
            const {status, data} = r.data;

            if (!status) throw new Error('Failed to fetch users count');

            this.setState({
                adminsCount: data.admins,
                usersCount: data.users,
                bannedCount: data.banned
            });
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
                const { page } = this.state;

                this.scrollLocked = true;
                this.searchUsers();
            });
        }
    };

    snack = (text) => {
        this.setState({
            snack: <Snackbar
                layout="vertical"
                onClose={() => this.setState({ snack: null })}
            >
                {text}
            </Snackbar>
        })
    };

    tab = (name) => {
        if (name === this.state.activeTab) return false;

        this.setState({
            activeTab: name,
            users: []
        }, this.searchUsers);
    };

    search = (e) => {
        this.setState({
            search: e.target.value
        }, this.searchUsers);
    };

    ban = (user, {mainStore} = this.props) => {
        const action = user.ban ? 'unban' : 'ban';

        axios.post(`/admin/users/${user.user_id}/${action}`, {
            auth: mainStore.auth
        }).then(r => {
            const {status} = r.data;

            if (!status) throw new Error('Failed to ban user');

            this.snack(user.ban ? `Пользователь ${user.first_name} разбанен(а)` : `Пользователь ${user.first_name} добавлен(а) в бан`);
            this.setState({ users: this.state.users.filter(u => u.user_id !== user.user_id) });
            this.fetchUsersCount();
        }).catch(e => {
            this.snack(user.ban ?
                `Ошибка: пользователя ${user.first_name} не удалось разбанить` :
                `Ошибка: пользователя ${user.first_name} не удалось забанить`
            );
        });
    };

    setBalance = (user, {mainStore} = this.props) => {
        const sum = Number(prompt('Введите баланс'));

        if (isNaN(sum)) return false;

        axios.post(`/admin/users/${user.user_id}/balance/set`, {
            auth: mainStore.auth,
            balance: sum
        }).then(r => {
            const {status} = r.data;

            if (!status) throw new Error('Failed to set balance');

            this.setState({
                users: this.state.users.map(u => {
                    if (u.user_id === user.user_id) {
                        u.balance = sum;
                    }

                    return u;
                })
            });

            this.snack(`Баланс пользователя ${user.first_name} изменен`);
        }).catch(e => {
            this.snack(`Ошибка: не удалось изменить баланс пользователя ${user.first_name}`);
        });
    };

    removeAdminPrivilege = (user, {mainStore} = this.props) => {
        axios.post(`/admin/admins/${user.user_id}/demote`, {
            auth: mainStore.auth
        }).then(r => {
            const {status} = r.data;

            if (!status) throw new Error('Failed to demote admin');

            this.setState({ users: this.state.users.filter(u => u.user_id !== user.user_id) });
            this.fetchUsersCount();
            this.snack(`Администратор ${user.first_name} разжалован`);
        }).catch(e => {
            this.snack(`Ошибка: не удалось разжаловать администратора ${user.first_name}`);
        });
    };

    openProfile = user => {
        window.open('https://vk.com/id' + user.user_id);
    };

    profile = () => {
        this.props.open('view1', 'show_profile');
    };

    select = (user) => {
        this.props.onSelect(user);
        this.options(user);
    };

    options = (user) => {
        const PLATFORM = this.props.platform;
        const IS_IOS = PLATFORM === IOS;

        this.props.onPopout(
            <ActionSheet onClose={() => {this.props.onPopout(null)}}>
                <ActionSheetItem
                    autoclose
                    onClick={() => this.openProfile(user)}
                >
                    Профиль VK
                </ActionSheetItem>
                <ActionSheetItem
                    autoclose
                    onClick={() => this.profile(user)}
                >
                    Данные о пользователе
                </ActionSheetItem>
                <ActionSheetItem
                    autoclose
                    onClick={() => this.setBalance(user)}
                >
                    Изменить баланс
                </ActionSheetItem>
                {this.state.activeTab === 'admins' &&
                    <ActionSheetItem
                        autoclose
                        onClick={() => this.removeAdminPrivilege(user)}
                    >
                        Забрать права админа
                    </ActionSheetItem>
                }
                <ActionSheetItem
                    autoclose
                    onClick={() => this.ban(user)}
                >
                    {user.ban ? 'Разбан' : 'Бан'}
                </ActionSheetItem>

                {IS_IOS && <ActionSheetItem autoclose mode="cancel">Выход</ActionSheetItem>}
            </ActionSheet>
        );
    };

    back = () => {
        window.history.back()
    };

    componentDidMount() {
        this.searchUsers();
        this.fetchUsersCount();

        window.addEventListener('scroll', this.scrollHandler);
    }

    componentWillUnmount() {
        window.removeEventListener('scroll', this.scrollHandler);
    }

    render() {
        return (
            <>
                <PanelHeader
                    addon={<PanelHeaderButton onClick={this.back}>Назад</PanelHeaderButton>}
                    left={<PanelHeaderBack onClick={this.back} />}
                >
                    Пользователи
                </PanelHeader>

                <FixedLayout vertical="top">
                    <Tabs mode="buttons">
                        <HorizontalScroll>
                            <TabsItem
                                onClick={() => {this.tab('admins')}}
                                selected={this.state.activeTab === 'admins'}
                                after={<Counter>{this.state.adminsCount}</Counter>}
                            >
                                Админы
                            </TabsItem>
                            <TabsItem
                                onClick={() => {this.tab('users')}}
                                selected={this.state.activeTab === 'users'}
                                after={<Counter>{this.state.usersCount}</Counter>}
                            >
                                Пользователи
                            </TabsItem>
                            <TabsItem
                                onClick={() => {this.tab('banned')}}
                                selected={this.state.activeTab === 'banned'}
                                after={<Counter>{this.state.bannedCount}</Counter>}
                            >
                                Бан
                            </TabsItem>
                        </HorizontalScroll>
                    </Tabs>

                    <Search
                        value={this.state.search}
                        onChange={this.search}
                        after={null}
                    />
                </FixedLayout>

                <Div style={{ paddingTop: 85, paddingBottom: this.state.activeTab === 'admins' ? 60 : 0 }}>
                    <Group>
                        <List>
                            {this.state.users.map((user, index) =>
                                <SimpleCell
                                    key={index}
                                    before={
                                        <Avatar size={40} src={user.photo_100} />
                                    }
                                    onClick={() => {
                                        this.select(user)
                                    }}
                                >
                                    <div>
                                        {user.first_name} {user.last_name} <div style={{ float: 'right' }}>🏆 {user.rank ?? '...'} 💎 {user.balance}</div>
                                    </div>
                                </SimpleCell>
                            )}
                        </List>
                    </Group>
                </Div>

                <FixedLayout vertical="bottom" style={{ background: '#fff' }}>
                    <Separator wide />
                    {this.state.activeTab === 'admins' &&
                        <Div>
                            <Button mode="secondary" onClick={this.newAdminModal}>Добавить админа</Button>
                        </Div>
                    }
                </FixedLayout>

                {this.state.snack}
            </>
        );
    }
}

export default withPlatform(Users);