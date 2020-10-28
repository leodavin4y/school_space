import React from "react";
import {withRouter} from "react-router-dom";
import {Panel} from "@vkontakte/vkui";

class NotFoundPage extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <Panel id="main">
                <h1>Страница не существует...</h1>
            </Panel>
        );
    }
}

export default withRouter(NotFoundPage);