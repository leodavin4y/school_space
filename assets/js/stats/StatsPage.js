import React from 'react';
import {withRouter} from "react-router-dom";
import {
    Div,
    InfoRow,
    Progress,
    Title,
    Subhead,
    View,
    Panel,
    PanelHeader,
    PanelHeaderButton,
    PanelHeaderBack, Root,
    Group, HorizontalScroll, Header, Avatar
} from '@vkontakte/vkui';
import {PromoCard} from "@happysanta/vk-app-ui";
import {inject, observer} from "mobx-react";
import axios from 'axios';
import MostActive from './MostActive';
import bridge from '@vkontakte/vk-bridge';
import {Api, getAccessToken} from "../utils";
import Link from "@vkontakte/vkui/dist/components/Link/Link";
import {Icon24User} from '@vkontakte/icons';
import ScrollContainer from 'react-indiana-drag-scroll'

@inject("mainStore")
@observer

class StatsPage extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            users_total: 0,
            points_total: 0,
            friends: [],
            page: 1,
            topUsers: [],
        };
    }

    /*fetchTopUsers = () => {
        axios({
            method: 'post',
            url: '/api/users',
            data: {
                page: this.state.page,
                auth: this.props.this.auth
            }
        }).then(response => {
            const users = response.data.data;

            this.setState((state, props) => ({
                page: state.page + 1,
                topUsers: [...state.topUsers, ...users]
            }));
        })
    };*/

    fetchStats = () => {
        axios({
            method: 'post',
            url: '/api/reports/total-stats',
            data: {
                auth: this.props.this.auth
            }
        }).then(response => {
            const data = response.data.data;

            this.setState({
                users_total: data.users_total,
                points_total: data.points_total
            })
        })
    };

    fetchFriendsStats = async () => {
        const token = await getAccessToken('friends');
        const friends = await Api('friends.getAppUsers', {
            access_token: token,
            v: 5.124
        });

        if (friends.response.length === 0) return false;

        axios({
            method: 'post',
            url: '/api/friends/get',
            data: {
                friends: friends.response,
                auth: this.props.this.auth
            }
        }).then(response => {
            this.setState({
                friends: response.data.data
            })
        })
    };

    componentDidMount() {
        this.fetchStats();
        this.fetchFriendsStats();
    }

    render() {
        const {user, userProfile} = this.props.mainStore;

        return (
            <Root activeView={this.props.activeView}>
                <View id="view1" activePanel={this.props.activePanel}>
                    <Panel id="main">
                        <PanelHeader
                            addon={<PanelHeaderButton onClick={() => { window.history.back() }}>Назад</PanelHeaderButton>}
                            left={<PanelHeaderBack onClick={() => { window.history.back() }} />}
                        >
                            Статистика
                        </PanelHeader>

                        <Div>
                            <Title level="2" weight="semibold" style={{ textTransform: 'uppercase' }}>
                                Статистика обмена оценок за месяц
                            </Title>
                        </Div>

                        <Div>
                            <InfoRow header={this.state.points_total + " умникоинов конвертировали " + this.state.users_total + " пользователей"}>
                                <Progress value={parseInt((this.state.points_total / 10000) * 100)} />
                            </InfoRow>
                            <div className="Subhead" style={{ padding: '5px 0', color: 'var(--text_secondary)' }}>
                                {parseInt((this.state.points_total / 10000) * 100)}%
                            </div>
                        </Div>

                        <Group
                            style={{ paddingBottom: 8 }}
                            header={<Header mode="secondary" style={{ textTransform: 'uppercase' }}>Ваши друзья собирают умникоины</Header>}
                        >
                            {this.state.friends.length === 0 &&
                                <Div>
                                    <PromoCard>
                                        <div style={{ textTransform: 'uppercase', color: 'var(--text_secondary)', textAlign: 'center' }}>
                                            Ваши друзья ещё не обменивали<br/> оценки в этом месяце
                                        </div>
                                    </PromoCard>
                                </Div>
                            }

                            {this.state.friends.length > 0 && this.props.mainStore.isMobile &&
                                <HorizontalScroll>
                                    <div className="Friends" style={{ display: 'flex' }}>
                                        {this.state.friends.map((friend) =>
                                            <Link href={'https://vk.com/id' + friend.user_id} key={friend.user_id} target="_blank">
                                                <div className="Friends__item">
                                                    <Avatar size={64} src={friend.photo_100} style={{ marginBottom: 8 }}/>
                                                    {friend.first_name}<br/>
                                                    💎 {friend.points}
                                                </div>
                                            </Link>
                                        )}
                                    </div>
                                </HorizontalScroll>
                            }

                            {this.state.friends.length > 0 && !this.props.mainStore.isMobile &&
                                <ScrollContainer className="Friends" style={{ display: 'flex' }}>
                                    {this.state.friends.map((friend) =>
                                        <Link href={'https://vk.com/id' + friend.user_id} key={friend.user_id} target="_blank">
                                            <div className="Friends__item">
                                                <Avatar size={64} src={friend.photo_100} style={{ marginBottom: 8 }}/>
                                                {friend.first_name}<br/>
                                                💎 {friend.points}
                                            </div>
                                        </Link>
                                    )}
                                </ScrollContainer>
                            }
                        </Group>

                        <Div>
                            <Title level="3" weight="medium" style={{ marginBottom: 5, textTransform: 'uppercase' }}>
                                Самые активные за месяц
                            </Title>

                            <MostActive/>
                        </Div>
                    </Panel>
                </View>
            </Root>
        );
    }
}

export default withRouter(StatsPage);