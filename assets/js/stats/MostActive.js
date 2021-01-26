import React from 'react';
import {Avatar, Button, Div, Link as VKLink} from "@vkontakte/vkui";
import {inject, observer} from "mobx-react";
import axios from "axios";
import {PromoCard} from "@happysanta/vk-app-ui";
import PropTypes from 'prop-types';

@inject("mainStore")
@observer
class MostActive extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            page: 1,
            users: []
        };
    }

    fetchTopUsers = () => {
        axios({
            method: 'post',
            url: `${prefix}/api/users`,
            data: {
                page: this.state.page,
                auth: this.props.mainStore.auth
            }
        }).then(response => {
            this.setState((state, props) => ({
                page: state.page + 1,
                users: [...state.users, ...response.data.data]
            }));
        })
    };

    componentDidMount() {
        const {users, initInProgress} = this.props;

        if (!users && !initInProgress) this.fetchTopUsers();
    }

    render() {
        const {user, userProfile} = this.props.mainStore;
        const {users} = this.state;
        const curUserId = user && user.info ? user.info.user_id : userProfile ? userProfile.id : 0;
        const usersPropsOrState = this.props.users ? this.props.users : users;

        let showCurUserRate = true;
        let topUsersIsEmpty = false;

        usersPropsOrState.forEach(u => {
            if (u.user_id === curUserId) showCurUserRate = false;
        });

        if (usersPropsOrState.length === 1 && !showCurUserRate && usersPropsOrState[0].points === 0) topUsersIsEmpty = true;
        if (usersPropsOrState.length === 0) topUsersIsEmpty = true;

        return (
            <>
                {topUsersIsEmpty &&
                    <Div style={{ paddingLeft: 0, paddingRight: 0 }}>
                        <PromoCard className="PromoCard">
                            <div style={{ textTransform: 'uppercase', color: 'var(--text_secondary)', textAlign: 'center' }}>
                                Рейтинг пуст, Обменяй оценки - попади в топ!
                            </div>
                        </PromoCard>
                    </Div>
                }

                {topUsersIsEmpty === false &&
                    <table className="TopUsers">
                        <thead>
                            <tr>
                                <th align="left">Пользователь</th>
                                <th>🏆</th>
                                <th>💎</th>
                            </tr>
                        </thead>
                        <tbody>
                            {this.props.users && this.props.users.map(item =>
                                <tr key={item.user_id}>
                                    <td key="1" align="left">
                                        <Avatar size={35} src={item.photo_100}/>
                                        <VKLink href={'https://vk.com/id' + item.user_id} target="_blank">
                                            {item.first_name} {item.last_name}
                                        </VKLink>
                                    </td>
                                    <td key="2">{item.rank}</td>
                                    <td key="3">{item.points}</td>
                                </tr>
                            )}

                            {users.map(item =>
                                <tr key={item.user_id}>
                                    <td key="1" align="left">
                                        <Avatar size={35} src={item.photo_100}/>
                                        <VKLink href={'https://vk.com/id' + item.user_id} target="_blank">
                                            {item.first_name} {item.last_name}
                                        </VKLink>
                                    </td>
                                    <td key="2">{item.rank}</td>
                                    <td key="3">{item.points}</td>
                                </tr>
                            )}

                            {(user === null || user.rating === null) && userProfile && showCurUserRate &&
                                <tr key={'I' + userProfile.id}>
                                    <td key="1" align="left">
                                        <Avatar size={35} src={userProfile.photo_100}/>
                                        <VKLink href={'https://vk.com/id' + userProfile.id} target="_blank">
                                            {userProfile.first_name} {userProfile.last_name}
                                        </VKLink>
                                    </td>
                                    <td key="2">...</td>
                                    <td key="3">...</td>
                                </tr>
                            }

                            {user && user.rating && showCurUserRate &&
                                <tr key={'I' + user.info.user_id}>
                                    <td key="1" align="left">
                                        <Avatar size={35} src={user.info.photo_100}/>
                                        <VKLink href={'https://vk.com/id' + user.info.user_id} target="_blank">
                                            {user.info.first_name} {user.info.last_name}
                                        </VKLink>
                                    </td>
                                    <td key="2">{user.rating.rank}</td>
                                    <td key="3">{user.rating.points}</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                }

                {this.props.initInProgress === false && usersPropsOrState.length > 0 && topUsersIsEmpty === false &&
                    <>
                        {this.props.moreBtn ? this.props.moreBtn :
                            <Button
                                size="xl"
                                mode="secondary"
                                onClick={this.fetchTopUsers}
                                style={{ marginTop: 15, cursor: 'pointer' }}
                            >
                                Показать ещё
                            </Button>
                        }
                    </>
                }
            </>
        );
    }
}

MostActive.defaultProps = {
    initInProgress: false,
    users: null
};

MostActive.propTypes = {
    initInProgress: PropTypes.bool,
    users: PropTypes.array
};

export default MostActive;