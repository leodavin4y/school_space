import React from "react";

/**
 * https://medium.com/@stasonmars/%D0%BF%D0%BE%D0%B3%D1%80%D1%83%D0%B6%D0%B0%D0%B5%D0%BC%D1%81%D1%8F-%D0%B2-%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D1%83-%D1%81-children-%D0%BD%D0%B0-react-f570844bcb88
 * @param children
 * @param activeView
 * @returns {*}
 * @constructor
 */
class ContentWrap extends React.Component {
    constructor(props) {
        super(props);

        this.handlerExec = {};
        this.current = null;
    }

    handlerMayExecuted = (view) => {

    };

    execOnLoad = (child) => {
        const view = this.props.activeView;

        if ('onLoad' in child.props && this.handlerExec[view] === false) {
            this.handlerExec[view] = true;
            child.props.onLoad();
        }

        if (this.current != view) this.handlerExec[this.current] = false;
    };

    getExecuted = () => {
        for (const k in this.handlerExec) {
            if (this.handlerExec.hasOwnProperty(k) && this.handlerExec[k]) return k;
        }

        return null;
    };

    componentDidMount() {}

    componentDidUpdate() {
        this.current = this.getExecuted();
    }

    render() {
        return (
            <div className={'MyView ' + (this.props.className ? this.props.className : '')} >
                {React.Children.map(this.props.children, (child) => {
                    const view = this.props.activeView;

                    if (view in this.handlerExec === false) this.handlerExec[view] = false;

                    if (child.props.id === view) {
                        this.execOnLoad(child);

                        return child;
                    }

                    return null;
                })}
            </div>
        );
    }
}

export default ContentWrap;