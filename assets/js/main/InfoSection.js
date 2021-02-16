import React from "react";
import {Avatar, Div, Group, Link, MiniInfoCell, SimpleCell, UsersStack} from "@vkontakte/vkui";
import {Icon20ArticleOutline, Icon20FollowersOutline, Icon20UserOutline, Icon20WorkOutline} from "@vkontakte/icons";
import {declOfNum, makeCancelable} from "../utils";
import bridge from "@vkontakte/vk-bridge";
import axios from "axios";

class InfoSection extends React.Component {

    constructor(props) {
        super(props);

        this.cancellablePromise1 = null;
        this.cancellablePromise2 = null;
        this.state = {
            moderators: [],     // Конвертаторы оценок на вкладке "Инфо"
            subscribers: [],    // Подписчики на вкладке "Инфо"
            group: null         // Информация о сообществе для вкладки "Инфо"
        };

    }

    fetchGroup = () => {
        const cancellable = makeCancelable(bridge.send("VKWebAppGetGroupInfo", {"group_id": 134978221}));

        cancellable
            .promise
            .then(data => {
                this.setState({ group: data })
            });

        return cancellable;
    };

    fetchUsers = () => {
        const {auth} = this.props;
        const cancellable = makeCancelable(axios({
            method: 'POST',
            url: `${prefix}/api/users-tab`,
            data: {
                auth: auth
            }
        }));

        cancellable
            .promise
            .then(r => {
                const {moderators, subscribers} = r.data.data;

                this.setState({
                    moderators: moderators,
                    subscribers: subscribers
                });
            });

        return cancellable;
    };

    fetchInfo = () => {
        this.cancellablePromise1 = this.fetchGroup();
        this.cancellablePromise2 = this.fetchUsers();
    };

    componentDidMount() {
        this.fetchInfo();
    }

    componentWillUnmount() {
        if (this.cancellablePromise1) this.cancellablePromise1.cancel();
        if (this.cancellablePromise2) this.cancellablePromise2.cancel();
    }

    render() {
        const {moderators, subscribers, group} = this.state;
        const members_count = group && group.members_count ? group.members_count : 15672;

        return (
            <Div>
                <MiniInfoCell
                    before={<Icon20ArticleOutline />}
                    textWrap="full"
                >
                    Вы учитесь в школе? Тогда у вас есть возможность получить призы за учебные успехи.
                    <br/><br/>

                    Умникоины - это система мотивации школьников к образовательной деятельности.
                    Приложение позволяет ученику превратить свои школьные оценки в мотивационные баллы,
                    чтобы их обменять на товары в благотворительном магазине.
                    <br/><br/>

                    Превратите ваши школьные оценки в умникоины.
                    Оценка 5 = 5 умникоинам. Остальные оценки приравниваются к 1 баллу.
                </MiniInfoCell>

                <MiniInfoCell
                    before={<Icon20WorkOutline />}
                    after={<Avatar size={24} src={group ? group.photo_50 : 'https://vk.com/images/community_50.png'} />}
                >
                    <Link href="https://vk.com/schoolspaceru" target="_blank">
                        {group && group.name ? group.name : '...'}
                    </Link>
                </MiniInfoCell>

                <MiniInfoCell
                    before={<Icon20FollowersOutline />}
                    after={
                        <UsersStack
                            photos={subscribers.map(u => u.photo_100)}
                        />
                    }
                >
                    { Number(members_count).toLocaleString('ru-RU') } { declOfNum(members_count, ['подписчик', 'подписчика', 'подписчиков']) }
                </MiniInfoCell>

                <MiniInfoCell
                    before={<Icon20UserOutline/>}
                >
                    Конвертаторы оценок
                </MiniInfoCell>

                <Group separator={true}>
                    {moderators.map(user =>
                        <SimpleCell
                            before={<Avatar src={user.photo_100}/>}
                            description="Модератор оценок"
                            key={user.id}
                        >
                            <Link href={`https://vk.com/id${user.id}`} target="_blank">
                                {user.first_name} {user.last_name}
                            </Link>
                        </SimpleCell>
                    )}
                </Group>
            </Div>
        );
    }
}

export default InfoSection;