import React from "react";
import {withRouter} from "react-router-dom";
import {Panel, Div, Link, Title} from "@vkontakte/vkui";

class NotFoundPage extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Panel id="main">
                <Div style={{ textAlign: 'center' }}>
                    <Title level="1" weight="semibold" style={{ marginBottom: 16 }}>Страница не существует... Или что-то пошло не так :(</Title>
                    Наша группа: <Link href="https://vk.com/schoolspaceru" target="_blank">Школьное пространство</Link>
                </Div>
            </Panel>
        );
    }
}

export default withRouter(NotFoundPage);