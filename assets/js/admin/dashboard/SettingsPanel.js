import React from 'react';
import {FormLayout, Input, PanelHeader, PanelHeaderBack, PanelHeaderButton} from "@vkontakte/vkui";

class SettingsPanel extends React.Component {

    constructor(props) {
        super(props);
    }

    back = () => {
        window.history.back()
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

                <FormLayout>
                    <Input type="text" />
                </FormLayout>
            </>
        );
    }
}

export default SettingsPanel;