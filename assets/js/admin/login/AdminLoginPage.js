import React from "react";
import {withRouter} from "react-router-dom";
import axios from "axios";
import {Panel, Root, View, ScreenSpinner, Placeholder} from "@vkontakte/vkui";

class AdminLoginPage extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            popout: null
        };

        this.title = this.randomRefs();
        this.timerId = null;
    }

    componentDidMount() {
        this.timerId = setTimeout(this.authenticateUser, 1000);
    }

    componentWillUnmount() {
        clearTimeout(this.authenticateUser);
    }

    auth = () => {
        return axios.post('/admin/login', {auth: this.props.this.auth})
            .then(response => {
                return response.data.status ? response.data.data : false;
            }).catch(e => {
                return false;
            })
    };

    authenticateUser = async () => {
        this.spinner(true);

        const auth = await this.auth();

        this.spinner(false);

        if (!auth) {
            console.log('Auth failure!');

            return this.props.signout(() => {
                console.log('Redirected to /');
                this.props.this.redirect("/");
            });
        }

        this.props.this.setState({
            loginData: auth
        });

        this.props.authenticate(() => {
            console.log('Redirected to admin');
            this.props.this.redirect("/admin/");
        });
    };

    spinner = (start) => {
        this.setState({
            popout: start ? <ScreenSpinner /> : null
        });
    };

    randomRefs = () => {
        const getRandomIntInclusive = (min, max) => {
            // Максимум и минимум включаются
            min = Math.ceil(min);
            max = Math.floor(max);

            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        return [
            'You Shall Not Pass',
            '⛧ Hell devours the indolent ... ⛧',
            'I used to be an adventurer like you, then I took an arrow in the knee',
            'Newfags can\'t triforce!',
            'Godd Howard',
            'Big brother is watching you',
            'I\'m teapot',
            'If you don\'t know how to do anything - make websites',
            'May the force be with you!'
        ][getRandomIntInclusive(0, 8)];
    };

    render() {
        return (
            <Root activeView="view1">
                <View id="view1" activePanel="main" popout={this.state.popout}>
                    <Panel id="main">
                        <Placeholder
                            header="Loading"
                            stretched
                        >
                            {this.title}
                        </Placeholder>
                    </Panel>
                </View>
            </Root>
        );
    }

}

export default withRouter(AdminLoginPage);