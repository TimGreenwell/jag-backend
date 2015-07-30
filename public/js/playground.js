import KPLGoal from './kpl-node-goal.js';
import KPLActivity from './kpl-node-activity.js';
import KPLNodePropertiesUI from './kpl-node-properties-ui.js';
import KPLEdge from './kpl-edge.js';
import KAOSRestImporter from './kaos-rest/kaos-rest-importer.js';


class PlaygroundElement extends HTMLElement {
	createdCallback() {
		console.log('Play ground created');
		this._nodes = [];
		this._selected = new Set();
		this._is_edge_being_created = false;
		this._property_ui = new KPLNodePropertiesUI();
		this._kaos_rest_importer = new KAOSRestImporter(); 

		this.initMenu();
		this.initGlobalEvents();
	}

	initMenu() {
		let add_root_goal = document.querySelector('#new-root'),
			add_subgoal = document.querySelector('#new-subgoal'),
			add_activity = document.querySelector('#new-activity'),
			del_node = document.querySelector('#del-node'),
			import_from_kaos= document.querySelector('#import-kaos');

		add_root_goal.addEventListener('click', this.addRootGoal.bind(this));
		add_subgoal.addEventListener('click', this.addSubGoal.bind(this));
		add_activity.addEventListener('click', this.addActivity.bind(this));
		del_node.addEventListener('click', this.deleteSelected.bind(this));
		import_from_kaos.addEventListener('click', this.importFromKAoS.bind(this));
	}

	initGlobalEvents() {
		this.addEventListener('mousedown', this.deselectAll.bind(this));
		this.addEventListener('mousemove', this.onEdgeUpdated.bind(this));
		this.addEventListener('mouseup', this.onEdgeCanceled.bind(this));
	}

	_initGenericNode(node, name, description) {
		node.setTitle(name);
		node.setContent(description);
		node.addEventListener('mousedown', (e) => {
			// If meta isn't pressed clear previous selection
			if(!e.metaKey) {
				this.deselectAll();
				this._selected.clear();
			}

			this._selected.add(node);
			this._property_ui.setNode(node);
			node.setSelected(true);
			e.stopPropagation();
		});

		this._nodes.push(node);
		this.appendChild(node);
		return node;
	}

	addRootGoal(name = 'Root Goal', description = 'Default description') {
		let node = new KPLGoal();
		node = this._initGenericNode(node, name, description);

		node.addOnEdgeInitializedListener(this.onEdgeInitialized.bind(this));
		return node;
	}

	addSubGoal(name = 'Subgoal', description = 'Default description') {
		let node = new KPLGoal();
		node = this._initGenericNode(node, name, description);

		node.addOnEdgeInitializedListener(this.onEdgeInitialized.bind(this));
		node.addOnEdgeFinalizedListener(this.onEdgeFinalized.bind(this));

		return node;
	}

	addActivity(name = 'Activity', description = 'Default activity description') {
		let node = new KPLActivity();
		node = this._initGenericNode(node, name, description);

		node.addOnEdgeFinalizedListener(this.onEdgeFinalized.bind(this));

		return node;
	}

	deselectAll() {
		this._selected.forEach(n => n.setSelected(false));
		this._property_ui.setNode(undefined);
	}

	deleteSelected() {
		for(let node of this._selected) {
			console.log('removing node', node);
			node.removeAllEdges();
			this._selected.delete(node);
			this.removeChild(node);
		}
	}

	_createEdge(origin) {
		let svg = document.querySelector('kpl-playground svg'),
			edge = new KPLEdge();

		edge.setNodeOrigin(origin);
		svg.appendChild(edge);
		return edge;
	}

	onEdgeInitialized(e, node) {
		this._created_edge = this._createEdge(node);
		this._is_edge_being_created = true;
		this._created_edge.setEnd(e.clientX, e.clientY);
	}

	onEdgeUpdated(e) {
		if(!this._is_edge_being_created)
			return;

		this._created_edge.setEnd(e.clientX, e.clientY);
	}

	onEdgeFinalized(e, node) {
		if(!this._is_edge_being_created)
			return;
		this._is_edge_being_created = false;
		this._created_edge.setNodeEnd(node);
	}

	onEdgeCanceled(e, node) {
		if(!this._is_edge_being_created)
			return;
		this._created_edge.remove();
		this._created_edge = undefined;
		this._is_edge_being_created = false;
	}

	importFromKAoS() {
		this._kaos_rest_importer.getActivityGraph()
		.then(this._generateActivityGraphFromJSON.bind(this));
	}

	_generateActivityGraphFromJSON(json) {
		console.log(json);
		let root_goal = json.rootGoal;
		let root_node = this.addRootGoal(root_goal.name, root_goal.description);
		root_node.getConnector().setType(root_goal.connectorType);
		root_node.setTranslation(100, 100);
		this._generateSubGoals(root_node, root_goal);
	}

	_generateSubGoals(root_node, root) {
		let x_start = root_node._translation.x,
			y_offset = root_node._translation.y + 150;

		if(!root.subgoals)
			return;

		root.subgoals.forEach(subgoal => {
			let node;
			if(subgoal.type == 'GOAL') {
				node = this.addSubGoal(subgoal.item.name, subgoal.item.description);
				node.getConnector().setType(subgoal.item.connectorType);
			} else {
				node = this.addActivity(subgoal.item.name, subgoal.item.description);
			}

			node.setTranslation(x_start, y_offset);

			let edge = this._createEdge(root_node);
			edge.setNodeEnd(node);

			this._generateSubGoals(node, subgoal.item);

			x_start += 175;

		});
	}
}

export default document.registerElement('kpl-playground', PlaygroundElement);