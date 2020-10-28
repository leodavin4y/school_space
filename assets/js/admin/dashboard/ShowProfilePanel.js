import React from 'react';
import {
    PanelHeader, PanelHeaderBack, PanelHeaderButton,
    Group, InfoRow, Header, SimpleCell, Avatar
} from "@vkontakte/vkui";

class ShowProfilePanel extends React.Component {

    constructor(props) {
        super(props);
    }

    back = () => {
        window.history.back()
    };

    render() {
        const {user} = this.props;

        return (
            <>
                <PanelHeader
                    addon={<PanelHeaderButton onClick={this.back}>Назад</PanelHeaderButton>}
                    left={<PanelHeaderBack onClick={this.back} />}
                >
                    Пользователь
                </PanelHeader>

                <Group>
                    <Header mode="secondary">Информация о пользователе</Header>
                    <SimpleCell
                        before={<Avatar src={user.photo_100} />}
                    >
                        {user.first_name} {user.last_name}
                    </SimpleCell>
                    <SimpleCell>
                        <InfoRow header="Баланс">
                            {user.balance}
                        </InfoRow>
                    </SimpleCell>
                    <SimpleCell>
                        <InfoRow header="Город">
                            {user.city}
                        </InfoRow>
                    </SimpleCell>
                    <SimpleCell>
                        <InfoRow header="Школа">
                            {user.school}
                        </InfoRow>
                    </SimpleCell>
                    <SimpleCell>
                        <InfoRow header="Класс">
                            {user.class}
                        </InfoRow>
                    </SimpleCell>
                    <SimpleCell>
                        <InfoRow header="Учитель">
                            {user.teacher}
                        </InfoRow>
                    </SimpleCell>
                </Group>
            </>
        );
    }
}

export default ShowProfilePanel;