import React from 'react';
import {
    Button, Div, PanelHeader, PanelHeaderBack,
    PanelHeaderButton, Text, Title, Link, Headline, Alert, Snackbar
} from "@vkontakte/vkui";
import {inject, observer} from "mobx-react";
import moment from 'moment';
import PropTypes from 'prop-types';
import bridge from '@vkontakte/vk-bridge';
import {randomStr} from "../utils";
import axios from 'axios';

const backFunc = () => {window.history.back()};
const BoldSpan = (props) => {
    return (<Text weight="semibold" style={{ display: 'inline-block' }}>{props.text}</Text>);
};

@inject("mainStore")
@observer
class SuccessfulPurchasePanel extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            snack: null
        };

        this.purchase_time = moment().format('DD.MM.YYYY HH:mm');
    }

    sendMessage = ({order, mainStore} = this.props) => {
        return axios.post(`${prefix}/api/orders/${order.id}/message/send`, {
            auth: mainStore.auth
        })
    };

    messageSubscribe = () => {
        bridge.send("VKWebAppAllowMessagesFromGroup", {
            "group_id": GROUP_ID,
            "key": randomStr()
        }).then(data => {
            if (!data.result) throw new Error('Message declined');

            this.sendMessage().then(r => {
                const {status, data} = r.data;

                if (status) {
                    this.snack('Подробности о покупке отправлены в личные сообщения');
                } else if('msg' in data) {
                    this.snack(r.data.data.msg);
                } else throw new Error('Failed to send msg')
            }).catch(e => {
                this.snack('Не удалось отправить уведомление о покупке в личные сообщения...');
            })
        }).catch(e => {
            this.alert();
        })
    };

    alert = () => {
        this.props.onAlert(<Alert
            actions={[{
                title: 'Отмена',
                autoclose: true,
                mode: 'cancel'
            }, {
                title: 'Разрешить сообщения',
                autoclose: true,
                action: () => this.messageSubscribe,
            }]}
            onClose={() => { this.props.onAlert(null) }}
        >
            <h2>Подписка на сообщения от сообщества</h2>
            <p>Для получения уведомлений о покупках вы должны разрешить сообщения от сообщества.</p>
        </Alert>);
    };

    snack = (text) => {
        this.setState({
            snack:
            <Snackbar onClose={() => { this.setState({snack: null}) }}>
                {text}
            </Snackbar>
        })
    };

    componentDidMount() {
        this.messageSubscribe();
    }

    render() {
        const {user} = this.props.mainStore;
        const {product, order} = this.props;

        return (
            <>
                <PanelHeader
                    addon={<PanelHeaderButton onClick={backFunc}>Назад</PanelHeaderButton>}
                    left={<PanelHeaderBack onClick={backFunc} />}
                >
                    Покупка
                </PanelHeader>

                <Div>
                    <Title level="1" weight="bold" style={{ marginBottom: 16 }}>
                        Вы обменяли умникоины на товар в благотворительном магазине
                    </Title>

                    <Headline weight="semibold" style={{ color: 'var(--text_secondary)', marginBottom: 16 }}>
                        {this.purchase_time}
                    </Headline>

                    <Text>
                        {user.info.first_name}, поздравляю! &nbsp;
                        {order.promo_code ?
                            <>Вы успели получить промокод: «<BoldSpan text={order.promo_code.code}/>» купив «<BoldSpan text={product.name}/>» за свою активность.</> :
                            <>Вы успели получить «<BoldSpan text={product.name}/>» за свою активность.</>
                        }
                        &nbsp; Скоро ваш запрос обработают и вам вышлют ваш подарок.
                        <br/><br/>
                        Обработка может занимать до 48 часов, проверьте, пожалуйста, что вы подписаны на <Link href="https://vk.com/schoolspaceru" target="_blank">Школьное Пространство</Link>.
                    </Text>

                    <Link href="https://vk.me/schoolspaceru" target="_blank">
                        <Button mode="primary" size="l" style={{ cursor: 'pointer', marginTop: 15 }}>Тех.поддержка</Button>
                    </Link>
                </Div>

                {this.state.snack}
            </>
        );
    }
}

SuccessfulPurchasePanel.propTypes = {
    order: PropTypes.object,
    product: PropTypes.object,
    onAlert: PropTypes.func
};

export default SuccessfulPurchasePanel;