export default class Popupable extends HTMLElement {

    constructor() {
        super();

        this._popupContent = document.createElement(`div`);
        this._popupContent.className = `popup-box`;
        this._popupContent.style.visibility = `hidden`;
        this.appendChild(this._popupContent);

        this._popups = [];
        this._popupHighlights = [];
        this._popupOutputs = {};
        this._suggestedHeight = 140;
    }

    // Creates the upper Name/Description part of the popup.
    // type provides an extra css classlist (besides popup-context)
    // properties, actions, fallback, skip are simply passed back out
    // Also passes back are type and _p.
    static _createPopup({type, name, description, properties, actions, fallback, skip}) {
        const _p = document.createElement(`p`);
        _p.classList.add(`popup-content`);
        _p.classList.add(type);

        const _name = document.createElement(`span`);
        _name.className = `popup-name`;

        if (typeof name === `string`) {
            _name.innerText = name;
        } else {
            _p.$name = (inputs) => {
                _name.innerText = name(inputs);
                return _name.innerText;
            };
        }

        const _description = document.createElement(`span`);
        _description.className = `popup-description`;

        if (typeof description === `string`) {
            _description.innerText = description;
        } else {
            _p.$description = (inputs) => {
                _description.innerText = description(inputs);
                return _description.innerText;
            };
        }

        _p.append(_name, _description);

        _p.setAttributeNS(null, `popup-type`, type);

        return {
            type,
            display: _p,
            properties,
            actions,
            fallback,
            skip
        };
    }


    async _displayNextPopup() {
        this._suggestedHeight = 160;
        if (this._popupCallback) {
            await this._popupCallback({outputs: this._popupOutputs});
        }

        for (const highlight of this._popupHighlights) {
            highlight.classList.remove(`${this._activePopup.content.type}-highlight`);
        }

        this._popupHighlights = [];

        let displayNext = true,
            displayThis = true;

        if (this._popups.length > 0) {
            this._activePopup = this._popups.splice(0, 1)[0];

            if (!this._popups) {
                this._popups = [];
            }

            const {content, trackEl, callback, properties, inputs, highlights} = this._activePopup;
            const loc = trackEl.getBoundingClientRect();
            const ix = loc.x,
                iy = loc.y,
                width = loc.width;

            this._popupContent.innerHTML = ``;

            const data = {
                inputs,
                outputs: this._popupOutputs
            };

            if (content.skip) {
                if (content.skip(data)) {
                    if (properties) {
                        for (const property in properties) {
                            this._popupOutputs[property] = properties[property].value;
                        }

                        data.outputs = this._popupOutputs;
                    }

                    let result;

                    if (content.fallback != undefined) {
                        if (typeof content.fallback === `number`) {
                            const boundAction = content.actions[content.fallback].action.bind(this);
                            result = await boundAction(data);
                        } else {
                            result = await content.fallback(data);
                        }
                    } else if (callback) {
                        this._popupCallback = callback;
                    }

                    if (result) {
                        for (const output in result) {
                            this._popupOutputs[output] = result[output];
                        }
                    }

                    displayThis = false;
                }
            }


            if (displayThis) {
                displayNext = false;

                if (content.display.$name) {
                    content.display.$name({inputs});
                } // ??
                if (content.display.$description) {
                    content.display.$description({inputs});
                } // ??

                this._popupContent.appendChild(content.display);

                const {x, y} = this._popupBounds.getBoundingClientRect();
                this._popupContent.style.left = `${ix - x + (width / 2) - 100}px`;
                this._popupContent.style.top = `${iy - y + 10}px`;
                this._popupContent.style.height = `10px`;

                trackEl.addEventListener(`change-position`, () => {
                    const newLoc = trackEl.getBoundingClientRect();
                    const nx = newLoc.x,
                        ny = newLoc.y;
                    this._popupContent.style.left = `${nx - x + (width / 2) - 100}px`;
                    this._popupContent.style.top = `${ny - y - 160}px`;
                });

                this._popupHighlights = highlights;

                for (const highlight of highlights) {
                    highlight.classList.add(`${content.type}-highlight`);
                }

                if (!this._popupInterval && !content.actions) {
                    this._popupInterval = setInterval(this._displayNextPopup.bind(this), 4000);
                } else if (this._popupInterval && content.actions) {
                    clearInterval(this._popupInterval);
                    this._popupInterval = undefined;
                }

                if (content.properties) {
                    this._activePopup.properties = {};

                    for (const {name, label, type, value = null, options = null} of content.properties) {
                        const $label = document.createElement(`label`);
                        $label.setAttribute(`for`, name);
                        $label.innerHTML = label;
                        this._suggestedHeight = this._suggestedHeight + 15;


                        let input_el = `input`;
                        if (type === `select`) {
                            input_el = `select`;
                        }
                        if (type === `textarea`) {
                            input_el = `textarea`;
                            this._suggestedHeight = this._suggestedHeight + 45;
                        }

                        const $input = document.createElement(input_el);
                        $input.setAttribute(`name`, name);
                        $input.setAttribute(`id`, name);

                        if (input_el === `input`) {
                            $input.setAttribute(`type`, type);
                        }

                        if (options) {
                            let roptions = options;

                            //  throws error - options is not a function.    --purpose?
                            if (!Array.isArray(options)) {
                                roptions = await options(data);
                            }

                            if (type === `textarea`) {
                                for (const [key, value] of roptions.entries()) {
                                    $input.setAttribute(key, value);
                                }
                            }

                            if (type === `text`) {
                                for (const [key, value] of roptions.entries()) {
                                    $input.addEventListener(key, value);
                                }
                            }


                            if (type === `select`) {
                                for (const {text, value} of roptions) {
                                    const $option = document.createElement(`option`);
                                    $option.setAttribute(`value`, value);
                                    $option.innerHTML = text;

                                    $input.appendChild($option);
                                }
                            }
                        }

                        if (value) {
                            $input.setAttribute(`value`, value);
                        }

                        this._popupContent.appendChild($label);
                        this._popupContent.appendChild($input);

                        this._activePopup.properties[name] = $input;
                    }
                }

                if (content.actions) {
                    this._suggestedHeight = this._suggestedHeight + 50;
                    for (const {text, color, bgColor, action} of content.actions) {
                        const boundAction = action ? action.bind(this) : undefined;
                        const actionBtn = document.createElement(`button`);
                        actionBtn.className = `popup-action`;
                        actionBtn.innerText = text;

                        if (color) {
                            actionBtn.style.color = color;
                        }
                        if (bgColor) {
                            actionBtn.style.backgroundColor = bgColor;
                        }

                        actionBtn.onclick = async function () {
                            let result;

                            if (this._activePopup.properties) {
                                for (const property in this._activePopup.properties) {
                                    this._popupOutputs[property] = this._activePopup.properties[property].value;
                                }

                                data.outputs = this._popupOutputs;
                            }

                            if (boundAction) {
                                result = await boundAction(data);
                            }

                            if (result) {
                                for (const output in result) {
                                    this._popupOutputs[output] = result[output];
                                }
                            }

                            await this._displayNextPopup();                   // ADDED AWAIT 25 Aug - test
                        }.bind(this);

                        this._popupContent.appendChild(actionBtn);
                    }
                } else if (callback) {
                    this._popupCallback = callback;
                }
                this._popupContent.style.height = `${this._suggestedHeight}px`;
                this._popupContent.style.visibility = `visible`;
            }
        }

        if (displayNext) {
            if (this._popupInterval) {
                clearInterval(this._popupInterval);
                this._popupInterval = undefined;
            }

            this._popupCallback = undefined;

            this._activePopup = undefined;

            this._popupContent.style.visibility = `hidden`;
        }
    }

    setPopupBounds(bounds) {
        this._popupBounds = bounds;
    }

    async popup({content, trackEl, callback, inputs = {}, highlights = []}) {
        this._popups.push({
            content,
            trackEl,
            callback,
            inputs,
            highlights
        });

        if (!this._popupInterval && !this._activePopup) {
            await this._displayNextPopup();
        }
    }

}

