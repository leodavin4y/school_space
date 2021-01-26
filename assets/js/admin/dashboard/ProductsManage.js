import React from 'react';
import {
    ActionSheet,
    ActionSheetItem,
    withPlatform,
    IOS,
    Snackbar,
    Button,
    Div,
    PanelHeader,
    ScreenSpinner
} from "@vkontakte/vkui";
import axios from 'axios';
import {inject, observer} from "mobx-react";
import ShopSection from "./../../main/ShopSection";
import PropTypes from 'prop-types';

@inject("mainStore")
@observer
class ProductsManage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            snack: null,
            refetchProducts: false
        };
    }

    removeProduct = (product) => {
        this.spinner(true);

        axios.post(`${prefix}/admin/products/${product.id}/delete`, {
            auth: this.props.mainStore.auth
        }).then(response => {
            if (!response.data.status) throw new Error('Delete failure');
            this.snack(`Товар «${product.name}» успешно удален`);
            this.setState({ refetchProducts: true })
        }).catch(e => {
            this.snack('Ошибка, не удалось удалить')
        }).finally(() => {
            this.spinner(false);
        })
    };

    disableProduct = (product) => {
        this.spinner(true);

        axios.post(`${prefix}/admin/products/${product.id}/disable`, {
            auth: this.props.mainStore.auth
        }).then(r => {
            if (!r.data.status) throw new Error('Disabling failure');
            this.snack(`Товар «${product.name}» успешно скрыт`);
            this.setState({ refetchProducts: true })
        }).catch(e => {
            this.snack('Ошибка, не удалось скрыть')
        }).finally(() => {
            this.spinner(false);
        })
    };

    enableProduct = (product) => {
        this.spinner(true);

        axios.post(`${prefix}/admin/products/${product.id}/enable`, {
            auth: this.props.mainStore.auth
        }).then(r => {
            if (!r.data.status) throw new Error('Disabling failure');
            this.snack(`Товар «${product.name}» успешно показан`);
            this.setState({ refetchProducts: true })
        }).catch(e => {
            this.snack('Ошибка, не удалось показать')
        }).finally(() => {
            this.spinner(false);
        })
    };

    onProductSelect = (product) => {
        const PLATFORM = this.props.platform;
        const IS_IOS = PLATFORM === IOS;

        this.props.onPopout(
            <ActionSheet onClose={() => {this.props.onPopout(null)}}>
                <ActionSheetItem
                    autoclose
                    onClick={
                        () => this.props.onEdit(product)
                    }
                >
                    Редактировать
                </ActionSheetItem>
                <ActionSheetItem
                    autoclose
                    onClick={
                        () => product.enabled ? this.disableProduct(product) : this.enableProduct(product)
                    }
                >
                    {product.enabled ? 'Не показывать' : 'Показать'}
                </ActionSheetItem>
                <ActionSheetItem
                    mode="destructive"
                    autoclose
                    onClick={
                        () => this.removeProduct(product)
                    }
                >
                    Удалить
                </ActionSheetItem>
                {IS_IOS && <ActionSheetItem autoclose mode="cancel">Отменить</ActionSheetItem>}
            </ActionSheet>
        )
    };

    snack = (text) => {
        this.setState({
            snack: <Snackbar onClose={() => { this.setState({snack: null}) }}>{text}</Snackbar>
        })
    };

    spinner = (seen) => {
        this.props.onPopout(seen ? <ScreenSpinner/> : null)
    };

    componentDidMount() {

    }

    render() {
        return (
            <>
                <PanelHeader>
                    Товары
                </PanelHeader>

                <Div>
                    <Button mode="secondary" onClick={this.props.onAddProduct}>
                        Добавить товар
                    </Button>
                </Div>

                <ShopSection
                    onSelect={this.onProductSelect}
                    refetchProducts={this.state.refetchProducts}
                    onRefetchProducts={() => {
                        this.setState({
                            refetchProducts: false
                        })
                    }}
                    spinner={this.spinner}
                />

                {this.state.snack}
            </>
        );
    }
}

ProductsManage.propTypes = {
    onAddProduct: PropTypes.func,
    onEdit: PropTypes.func,
    onPopout: PropTypes.func
};

export default withPlatform(ProductsManage);