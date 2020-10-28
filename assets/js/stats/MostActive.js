import React from 'react';
import {Avatar, Button, Link as VKLink} from "@vkontakte/vkui";
import {inject, observer} from "mobx-react";
import axios from "axios";

@inject("mainStore")
@observer

class MostActive extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            page: 1,
            users: this.props.users ? this.props.users : []
        };
    }

    fetchTopUsers = () => {
        axios({
            method: 'post',
            url: '/api/users',
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
        if (!this.props.users) this.fetchTopUsers();
    }

    render() {
        const {user, userProfile} = this.props.mainStore;
        const {users} = this.state;

        return (
            <>
                <table className="TopUsers">
                    <thead>
                        <tr>
                            <th align="left">Пользователь</th>
                            <th>🏆</th>
                            <th>💎</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((item) =>
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

                        {(user === null || user.rating === null) && userProfile &&
                            <tr key={'I' + userProfile.id}>
                                <td key="1" align="left">
                                    <Avatar size={35} src={userProfile.photo_100}/>
                                    <VKLink href={'https://vk.com/id' + userProfile.user_id} target="_blank">
                                        {userProfile.first_name} {userProfile.last_name}
                                    </VKLink>
                                </td>
                                <td key="2">...</td>
                                <td key="3">...</td>
                            </tr>
                        }

                        {user && user.rating &&
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
        );
    }
}

export default MostActive;