import React from 'react';
import {withRouter} from "react-router-dom";
import {
    Div,
    InfoRow,
    Progress,
    Title,
    View,
    Panel,
    PanelHeader,
    PanelHeaderButton,
    PanelHeaderBack, Root,
    Group, HorizontalScroll, Header, Avatar, Text, Button as VKButton
} from '@vkontakte/vkui';
import {PromoCard} from "@happysanta/vk-app-ui";
import {inject, observer} from "mobx-react";
import axios from 'axios';
import MostActive from './MostActive';
import {Api, declOfNum, getAccessToken, storageSupported, storageSet, storageGet} from "../utils";
import Link from "@vkontakte/vkui/dist/components/Link/Link";
import ScrollContainer from 'react-indiana-drag-scroll';
import Popup from '../components/popup/popup';

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
            popup: null
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
            url: `${prefix}/api/reports/total-stats`,
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

    accessPermissionPopup = () => {
        return new Promise(async (resolve, reject) => {
            const close = () => { this.setState({ popup: null }) };
            const onClose = () => { close(); reject(false) };
            const allow = () => {
                close();
                storageSet('friends_granted', '1');
                resolve(true);
            };

            const storage = storageSupported() ? (await storageGet('friends_granted')) : null;

            if (storage && storage.friends_granted === '1') return resolve(true);

            this.setState({
                popup:
                    <Popup onClose={onClose}>
                        <Title level="2" weight="semibold" style={{ marginBottom: 5, textTransform: 'uppercase' }}>
                            Запрос доступа
                        </Title>

                        <Text weight="regular" style={{ paddingTop: 16, paddingBottom: 16 }}>
                            Если вы желаете, чтобы данные о статистике ваших друзей отображались в приложении,
                            подтвердите доступ к данным вашей страницы.
                        </Text>

                        <VKButton onClick={allow}>OK</VKButton>
                    </Popup>
            })
        })
    };

    fetchFriendsStats = async () => {
        const accessPermission = await this.accessPermissionPopup().catch(() => { return false });

        if (!accessPermission) return false;

        const token = await getAccessToken('friends');
        const friends = await Api('friends.getAppUsers', {
            access_token: token,
            v: 5.124
        });

        if (friends.response.length === 0) return false;

        axios({
            method: 'post',
            url: `${prefix}/api/friends/get`,
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
        const {isMobile} = this.props.mainStore;
        const {points_total, users_total, friends} = this.state;
        const back = () => {window.history.back()};
        const coinsStr = declOfNum(points_total, ['умникоин', 'умникоина', 'умникоинов']);
        const usersStr = declOfNum(users_total, ['пользователь', 'пользователя', 'пользователей']);

        return (
            <Root activeView={this.props.activeView}>
                <View id="view1" activePanel={this.props.activePanel}>
                    <Panel id="main">
                        <PanelHeader
                            addon={<PanelHeaderButton onClick={back}>Назад</PanelHeaderButton>}
                            left={<PanelHeaderBack onClick={back} />}
                        >
                            Статистика
                        </PanelHeader>

                        <Div>
                            <Title level="2" weight="semibold" style={{ textTransform: 'uppercase' }}>
                                Статистика обмена оценок за месяц
                            </Title>
                        </Div>

                        <Div>
                            <InfoRow header={`${points_total} ${coinsStr} конвертировал(и) ${users_total} ${usersStr}`}>
                                <Progress value={parseInt((points_total / 10000) * 100)} />
                            </InfoRow>
                            <div className="Subhead" style={{ padding: '5px 0', color: 'var(--text_secondary)' }}>
                                {parseInt((points_total / 10000) * 100)}%
                            </div>
                        </Div>

                        <Group
                            style={{ paddingBottom: 8 }}
                            header={<Header mode="secondary" style={{ textTransform: 'uppercase' }}>Ваши друзья собирают умникоины</Header>}
                        >
                            {friends.length === 0 &&
                                <Div>
                                    <PromoCard className="PromoCard">
                                        <div style={{ textTransform: 'uppercase', color: 'var(--text_secondary)', textAlign: 'center' }}>
                                            Ваши друзья ещё не обменивали<br/> оценки в этом месяце
                                        </div>
                                    </PromoCard>
                                </Div>
                            }

                            {friends.length > 0 && isMobile &&
                                <HorizontalScroll>
                                    <div className="Friends" style={{ display: 'flex' }}>
                                        {friends.map((friend) =>
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

                            {friends.length > 0 && !isMobile &&
                                <ScrollContainer className="Friends" style={{ display: 'flex' }}>
                                    {friends.map((friend) =>
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

                        {this.state.popup}
                    </Panel>
                </View>
            </Root>
        );
    }
}

export default withRouter(StatsPage);