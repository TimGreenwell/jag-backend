class FormUtils {

    static createEmptyInputContainer(id) {
        const container = document.createElement(`div`);
        container.setAttribute(`id`, id);
        return container;
    }

    static createPropertyElement(id, name) {
        const element = document.createElement(`div`);
        element.className = `property-item`;
        const label = document.createElement(`label`);
        label.setAttribute(`for`, id);
        label.innerHTML = name;
        element.appendChild(label);
        return element;
    }

    static createTextInput(id) {
        const input = document.createElement(`input`);
        input.setAttribute(`type`, `text`);
        input.setAttribute(`id`, id);
        return input;
    }

    static createButton(id, text) {
        const button = document.createElement(`button`);
        button.setAttribute(`id`, id);
        button.innerHTML = text;
        return button;
    }

    static updateSelect($selectElement, options, selected = undefined) {
        while ($selectElement.firstChild) {
            $selectElement.removeChild($selectElement.firstChild);
        }
        options.forEach((item) => {
            if (item.label) {
                const opgr_el = document.createElement(`optgroup`);
                opgr_el.setAttribute(`label`, item.label);

                item.options.forEach((option) => {
                    const opt_el = document.createElement(`option`);
                    opt_el.value = option.value;
                    opt_el.text = option.text;
                    opgr_el.appendChild(opt_el);
                });

                $selectElement.add(opgr_el);
            } else {
                const opt_el = document.createElement(`option`);
                opt_el.value = item.value;
                opt_el.text = item.text;
                $selectElement.add(opt_el);
            }
        });

        if (selected) {
            $selectElement.value = selected;
        } else {
            $selectElement.value = undefined;
        }

        return $selectElement;
    }


    static createSelect(id, options = undefined, selected = undefined) {
        let input = document.createElement(`select`);
        input.setAttribute(`id`, id);
        if (options) {
            input = FormUtils.updateSelect(input, options, selected);
        }
        return input;
    }

    static toggleSelectValues(select_el, valid_values) {
        const selected_option = select_el.selectedOptions[0];

        for (const option of select_el.options) {
            option.disabled = !valid_values.has(option.value);
        }

        if (selected_option) {
            select_el.value = selected_option.value;
        }
    }

}

export default FormUtils;
