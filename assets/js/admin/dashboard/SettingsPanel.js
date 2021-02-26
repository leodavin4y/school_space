import React from 'react';
import {
    Button, Div, PanelHeader, PanelHeaderBack,
    PanelHeaderButton, Snackbar, CellButton, Group,
    Header
} from "@vkontakte/vkui";
import axios from 'axios';
import bridge from '@vkontakte/vk-bridge';
import {inject, observer} from "mobx-react";

@inject("mainStore")
@observer
class SettingsPanel extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            snack: null,
            token: null
        };
    }

    back = () => {
        window.history.back()
    };

    wipe = () => {
        return false;
        if (!confirm('Вы уверены?')) return false;

        axios.post(`${prefix}/admin/wipe`, {
            auth: this.props.mainStore.auth
        }).then(r => {
            const {status} = r.data;

            if (!status) throw new Error('Failed to wipe users balance');

            this.snack('Запущен процесс обнуления баланса пользователей');
        }).catch(e => {
            this.snack('Не удалось запустить обнуление баланса пользователей');
        })
    };

    snack = (text) => {
        const hide = () => { this.setState({snack: null}) };

        this.setState({
            snack: <Snackbar onClose={hide}>{text}</Snackbar>
        })
    };

    accessToken = () => {
        const { authParsed } = this.props.mainStore;

        if (!confirm('Желаете выпустить ключ доступа сообщества для управления виджетом?')) return;

        bridge.send("VKWebAppGetCommunityToken", {
            "app_id": parseInt(authParsed.vk_app_id),
            "group_id": parseInt(authParsed.vk_group_id),
            "scope": "app_widget"
        }).then(({ access_token }) => {
            this.setState({ token: access_token });
            this.snack('Токен успешно получен');
        });
    };

    widgetPreview = (type, code) => {
        const { authParsed } = this.props.mainStore;

        bridge.send("VKWebAppShowCommunityWidgetPreviewBox", {
            "group_id": parseInt(authParsed.vk_group_id),
            "type": type,
            "code": code
        }).then(({ result }) => {
            this.snack(result ? 'Виджет установлен в сообщество' : 'Произошла ошибка');
        }).catch(({ error_data }) => {
            // User denied
            if (error_data.error_code === 4) return;
            console.log(e);
            this.snack('Произошла ошибка');
        });
    };

    widget = () => {
        this.fetchWidget()
            .then(widget => {
                this.widgetPreview(widget.type, widget.code);
            });
    };

    widgetDelete = () => {
        this.widgetPreview('text', 'return false;');
    };

    fetchWidget = () => {
        return axios({
            method: 'post',
            url: `${prefix}/api/widget`,
            data: { auth: this.props.mainStore.auth }
        }).then(r => {
            return r.data.data;
        });
    };

    render() {
        return (
            <>
                <PanelHeader
                    addon={<PanelHeaderButton onClick={this.back}>Назад</PanelHeaderButton>}
                    left={<PanelHeaderBack onClick={this.back} />}
                >
                    Настройки
                </PanelHeader>

                <Div>
                    <Button mode="destructive" disabled onClick={this.wipe}>Обнулить умникоины пользователей</Button>
                </Div>

                <Group header={<Header mode="secondary">Управление виджетом сообщества</Header>}>
                    <CellButton onClick={this.accessToken}>Получить токен</CellButton>
                    {this.state.token &&
                        <Div>{this.state.token}</Div>
                    }
                    <CellButton onClick={this.widget}>Установить виджет</CellButton>
                    <CellButton mode="danger" onClick={this.widgetDelete}>Удалить виджет</CellButton>
                </Group>

                {this.state.snack}
            </>
        );
    }
}

export default SettingsPanel;