import React from 'react';
import {
    Button,
    FormLayout,
    Input,
    Textarea,
    File,
    Div,
    FormLayoutGroup, Snackbar, PanelHeaderButton,
    PanelHeaderBack, PanelHeader, Checkbox, Select
} from "@vkontakte/vkui";
import {Icon24Camera} from '@vkontakte/icons';
import {inject, observer} from "mobx-react";
import axios from 'axios';
import PropTypes from 'prop-types';
import {declOfNum} from "../../utils";
import { Editor } from '@tinymce/tinymce-react';

@inject("mainStore")
@observer
class NewProductPanel extends React.Component {

    constructor(props){
        super(props);

        this.state = {
            name: '',
            descr: '',
            price: '',
            remaining: '',
            enabled: false,
            num: 0,
            photo: null,
            preview: null,
            photoNotModified: true,
            snack: null,
            restrict_freq_enabled: false,
            restrict_freq_time: 0,
            restrict_freq: 1
        };

        this.inputFile = React.createRef();
        this.restrictFreqTimeOptions = [
            {sec: 60, text: 'в 1 мин'},
            {sec: 600, text: 'в 10 мин'},
            {sec: 1800, text: 'в 30 мин'},
            {sec: 3600, text: 'в 1 час'},
            {sec: 7200, text: 'в 2 часа'},
            {sec: 86400, text: 'в 24 часа'},
            {sec: 604800, text: 'в неделю'},
            {sec: 2592000, text: 'в месяц'},
        ];
    }

    name = (e) => {
        this.setState({ name: e.target.value })
    };

    description = (e) => {
        this.setState({ descr: e.target.getContent() })
    };

    price = (e) => {
        this.setState({ price: e.target.value })
    };

    photo = () => {
        const reader = new FileReader();
        const files = this.inputFile.current.files;

        if (files.length > 0) {
            const file = files[files.length - 1];

            reader.onload = (e) => {
                const photo = e.target.result;
                const blob = new Blob([new Uint8Array(photo)], {type: file.type});

                this.setState({
                    photo: blob,
                    preview: URL.createObjectURL(blob),
                    photoNotModified: false
                });
            };

            reader.readAsArrayBuffer(file);
        }
    };

    removePhoto = () => {
        this.setState({ photo: null, preview: null })
    };

    remaining = (e) => {
        this.setState({ remaining: e.target.value })
    };

    enabled = (e) => {
        this.setState({ enabled: !this.state.enabled })
    };

    num = (e) => {
        this.setState({ num: e.target.value });
    };

    restrictFreqEnable = () => {
        this.setState({ restrict_freq_enabled: !this.state.restrict_freq_enabled })
    };

    restrictFreqTime = (e) => {
        this.setState({ restrict_freq_time: e.target.value })
    };

    restrictFreq = (e) => {
        this.setState({ restrict_freq: e.target.value })
    };

    snack = (text) => {
        this.setState({
            snack: <Snackbar onClose={() => { this.setState({snack: null}) }}>{text}</Snackbar>
        })
    };

    productSave = () => {
        if (this.state.name.trim() === '' || isNaN(parseInt(this.state.price))) return false;
        const form = new FormData();

        form.append('name', this.state.name);
        form.append('description', this.state.descr);
        form.append('price', this.state.price);
        form.append('photo', this.state.photo);
        form.append('remaining', this.state.remaining);
        form.append('enabled', String(this.state.enabled ? 1 : 0));
        form.append('num', this.state.num);
        form.append('auth', this.props.mainStore.auth);

        if (this.props.product) {
            form.append('id', this.props.product.id);

            if (this.state.photoNotModified) {
                form.delete('photo');
            }
        }

        if (this.state.restrict_freq_enabled) {
            form.append('restrict_freq', this.state.restrict_freq);
            form.append('restrict_freq_time', this.restrictFreqTimeOptions[this.state.restrict_freq_time]);
        }

        axios({
            method: 'post',
            url: `${prefix}/admin/product/` + (this.props.product ? 'update' : 'store'),
            data: form
        }).then(response => {
            const result = response.data;

            if (!result.status) throw new Error('Failed to store product');

            const {product} = result.data;

            this.props.setProduct(product);

            this.snack(`Товар ${product.name} успешно ` + (this.props.product ? 'изменен' : 'добавлен'));
        }).catch(e => {
            this.snack(`Произошла ошибка`);
        });
    };

    loadXHR = (url) => {
        return new Promise(function(resolve, reject) {
            try {
                const xhr = new XMLHttpRequest();

                xhr.open("GET", url);
                xhr.responseType = "blob";
                xhr.onerror = function() {reject("Network error.")};
                xhr.onload = function() {
                    if (xhr.status === 200) {resolve(xhr.response)}
                    else {reject("Loading error:" + xhr.statusText)}
                };
                xhr.send();
            }
            catch(err) {reject(err.message)}
        });
    };

    back = () => {
        this.props.onBack();
        window.history.back();
    };

    usePropsedProduct = async () => {
        const {product} = this.props;

        if (!product) return false;

        let photoBlob, photoURL;

        if (product.photo) {
            photoURL = prefix + '/upload/products/' + product.photo;
            photoBlob =
                await this.loadXHR(photoURL)
                    .then(blob => {
                        return blob
                    });
        }

        this.setState({
            name: product.name,
            descr: product.description,
            price: product.price,
            remaining: product.remaining,
            photo: photoBlob,
            preview: photoURL,
            enabled: product.enabled,
            num: product.num
        });

        if (product.restrict_freq_time !== null && product.restrict_freq !== null) {
            let time = 0;

            this.restrictFreqTimeOptions.forEach(option => {
                if (option.sec === product.restrict_freq_time) time = product.restrict_freq_time;
            });

            this.setState({
                restrict_freq_enabled: true,
                restrict_freq_time: time,
                restrict_freq: product.restrict_freq
            });
        }
    };

    componentDidMount() {
        this.usePropsedProduct();
    }

    render() {
        const {product} = this.props;

        return (
            <>
                <PanelHeader
                    addon={<PanelHeaderButton onClick={this.back}>Назад</PanelHeaderButton>}
                    left={<PanelHeaderBack onClick={this.back} />}
                >
                    {product ? 'Изменить' : 'Добавить'} товар
                </PanelHeader>

                <FormLayout>
                    <Input
                        top="Наименование"
                        placeholder="Наименование (до 255 симв.)"
                        onChange={this.name}
                        value={this.state.name}
                        key='name'
                    />

                    {/*<Textarea
                        top="Описание"
                        placeholder="Описание товара (до 65 тыс. симв.)"
                        onChange={this.description}
                        value={this.state.descr}
                    />*/}
                    <FormLayoutGroup top="Описание">
                        <Div style={{ paddingTop: 0, paddingBottom: 0 }}>
                            <Editor
                                apiKey="4agmyus6h1io2b7a9hn40q6pl4bgbnjnnwnr46lvyzzrtg6j"
                                initialValue={this.state.descr}
                                init={{
                                    height: 250,
                                    menubar: false,
                                    plugins: [
                                        'advlist autolink lists link image charmap print preview anchor',
                                        'searchreplace visualblocks code fullscreen',
                                        'insertdatetime media table paste code help wordcount'
                                    ],
                                    toolbar:
                                        'undo redo | link bold italic backcolor | \
                                        bullist numlist outdent indent'
                                }}
                                onChange={this.description}
                            />
                        </Div>
                    </FormLayoutGroup>


                    <Input
                        type="number"
                        top="Стоимость"
                        placeholder="Кол-во умникоинов (целое число)"
                        onChange={this.price}
                        value={this.state.price}
                        key='price'
                    />

                    <Input
                        type="number"
                        top="Кол-во товара"
                        placeholder="Кол-во (целое число)"
                        onChange={this.remaining}
                        value={this.state.remaining}
                        key='remaining'
                    />

                    <Checkbox
                        checked={this.state.restrict_freq_enabled}
                        onChange={this.restrictFreqEnable}
                    >
                        Ограничить кол-во покупок одним пользователем
                    </Checkbox>

                    {this.state.restrict_freq_enabled &&
                        <Select
                            top="Ограничение по времени"
                            value={this.state.restrict_freq_time}
                            onChange={this.restrictFreqTime}
                        >
                            {this.restrictFreqTimeOptions.map(item =>
                                <option value={item.sec} key={item.sec}>
                                    {this.state.restrict_freq} {declOfNum(this.state.restrict_freq, ['раз', 'раза', 'раз'])} {item.text}
                                </option>
                            )}
                        </Select>
                    }

                    {this.state.restrict_freq_enabled &&
                        <Input
                            type="number"
                            top="Разрешенное кол-во покупок"
                            placeholder="Разрешенное кол-во покупок"
                            onChange={this.restrictFreq}
                            value={this.state.restrict_freq}
                            min={0}
                            key='restrict_freq'
                        />
                    }

                    <Input
                        type="number"
                        top="Позиция в магазине"
                        placeholder="Позиция (целое число)"
                        onChange={this.num}
                        value={this.state.num}
                        key='num'
                    />

                    <Checkbox
                        checked={this.state.enabled}
                        onChange={this.enabled}
                    >
                        Показывать в магазине
                    </Checkbox>

                    <Button
                        mode="secondary"
                        size="l"
                        onClick={
                            () => {
                                this.props.open('view4', 'product_promo_codes')
                            }
                        }
                    >
                        Промокоды
                    </Button>

                    <div style={{width: '100%', overflow: 'hidden' }}>
                        <FormLayoutGroup>
                            <File
                                before={<Icon24Camera />}
                                controlSize="l"
                                getRef={this.inputFile}
                                onChange={this.photo}
                                style={{ float: 'left' }}
                            >
                                Фото
                            </File>

                            <Button
                                mode="primary"
                                size="l"
                                onClick={this.productSave}
                                style={{ float: 'left', marginLeft: 0, marginTop: 0 }}
                            >
                                {this.state.product ? 'Изменить' : 'Сохранить'} товар
                            </Button>
                        </FormLayoutGroup>
                    </div>
                </FormLayout>

                <Div>
                    {this.state.photo && this.state.preview &&
                        <>
                            <div className="PhotoPreview__frame">
                                <img src={this.state.preview} alt="Photo" />
                            </div>

                            <Button mode="secondary" onClick={this.removePhoto}>Удалить</Button>
                        </>
                    }
                </Div>

                {this.state.snack}
            </>
        );
    }
}

NewProductPanel.propTypes = {
    activePanel: PropTypes.string,
    setProduct: PropTypes.func
};

NewProductPanel.defaultProps = {
    product: null,
    onBack: () => {}
};

export default NewProductPanel;