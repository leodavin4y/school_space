import React from 'react';
import {Button, Div, PanelHeader, PanelHeaderBack, PanelHeaderButton, Snackbar} from "@vkontakte/vkui";
import axios from 'axios';
import {inject, observer} from "mobx-react";

@inject("mainStore")
@observer
class SettingsPanel extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            snack: null
        };
    }

    back = () => {
        window.history.back()
    };

    wipe = () => {
        if (!confirm('Вы уверены?')) return false;

        axios.post('/admin/wipe', {
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
        this.setState({
            snack: <Snackbar onClose={() => {
                this.setState({snack: null})
            }}>{text}</Snackbar>
        })
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
                    <Button mode="destructive" onClick={this.wipe}>Обнулить умникоины пользователей</Button>
                </Div>

                {this.state.snack}
            </>
        );
    }
}

export default SettingsPanel;