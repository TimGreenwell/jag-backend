const XMLNS = 'http://www.w3.org/2000/svg';

class KPLEdgeElement extends SVGGElement {

	createdCallback() {
		console.log('Creating new KPLEdge');
		this.init();
	}

	init() {
		this._origin = {x : 0, y : 0};
		this._end = {x : 0, y : 0};
		this._node_origin = undefined;
		this._node_end = undefined;
		this._edge_el = document.createElementNS(XMLNS, 'path');
		this._edge_el.setAttributeNS(null, 'stroke-weight', '2');
		this._edge_el.setAttributeNS(null, 'stroke', 'gray');
		this._edge_el.setAttributeNS(null, 'fill', 'transparent');
		this.appendChild(this._edge_el);

		this._edge_el.addEventListener('click', e => {
			this._edge_el.setAttributeNS(null, 'stroke', 'red');
		});
	}

	destroy() {
		this.ownerSVGElement.removeChild(this);

		if(this._node_origin != undefined)
			this._node_origin.removeOutEdge(this);
		if(this._node_end != undefined)
			this._node_end.removeInEdge(this);
	}

	setNodeOrigin(node) {
		this._node_origin = node;
		node.addOutEdge(this);
	}

	setNodeEnd(node) {
		this._node_end = node;
		node.addInEdge(this);
	}

	setOrigin(x, y) {
		this._origin.x = x;
		this._origin.y = y;

		this._applyPath();
	}

	setEnd(x, y) {
		this._end.x = x;
		this._end.y = y;

		this._applyPath();
	}

	_applyPath() {

		let x1 = this._origin.x + 50,
			y1 = this._origin.y,
			x2 = this._end.x - 50,
			y2 = this._end.y;

		this._data = `M ${this._origin.x} ${this._origin.y} C ${x1} ${y1}, ${x2} ${y2}, ${this._end.x} ${this._end.y}`;

		this._edge_el.setAttributeNS(null, 'd', this._data);
	}

	setGreyedOut(is_greyed_out) {
		this._is_greyed_out = is_greyed_out;

		if(is_greyed_out)
			this.className = 'greyed-out-node';
		else
			this.className = '';
	}

	setSelected(is_selected) {
		this._is_selected = is_selected;

		if(is_selected)
			this.className = 'selected-node';
		else
			this.className = '';
	}
}

export default document.registerElement('kpl-edge', {
	prototype: KPLEdgeElement.prototype,
	extends: 'g'
});