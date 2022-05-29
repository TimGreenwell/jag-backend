/**
 * @fileOverview AnalysisModel view.
 *
 * @author mvignati
 * @version 2.50
 */

'use strict';

import AgentModel from '../models/agent.js';
import DOMUtils from '../utils/dom.js';
import ContextMenu from '../ui/context-menu.js';
import ColumnHeader from './column-header-cell.js';
import AssessmentView from './assessment-cell.js';
import JagCell from './jag-cell.js';

class AnalysisView extends HTMLElement {

	constructor(analysisModel, table) {
		super();
		this._analysisModel = analysisModel;
		this._columnHeaderMap = new Map();
		this._leafArray = new Array();
		this._assessment_menu = undefined;
		this._idToTableCellMap = new Map();
		this._initializeContextMenus();
		this._initializeStaticHeaders();
		this._initializeTree(this._analysisModel.rootNodeModel);
		this.layout();
	////	await updatedAnalysis.buildAnalysisJagNodes(rootNodeModel);
	}


	get analysisModel() {
		return this._analysisModel;
	}

	set analysisModel(value) {
		this._analysisModel = value;
	}

	initialize() {
		// Appends this view to the specified ia-table

	//	table.appendChild(this);

		// // Registers root view
		// this._analysisJagRoot = this._analysisModel.root;
		//
		// this._initializeContextMenus();
		// this._initializeStaticHeaders();
		// this._initializeTree(this._analysisModel.root);
		//
		// // TODO: temporary ugly fix
		// // this._idToTableCellMap.get(this._analysisModel.root.id).model.syncJAG(this._idToTableCellMap.get(this._analysisModel.root.id));
		//
		// this.layout();
	}

	// If agent exists, get related assessment.  If not, create and return empty assessment.
	getAssessments(agent) {
		let agent_assessment_views = this._idToTableCellMap.get(agent.id);
		if(agent_assessment_views === undefined) {
			agent_assessment_views = new Map();
			this._idToTableCellMap.set(agent.id, agent_assessment_views);
		}
		return agent_assessment_views;
	}

	getAssessmentView(agent, node, agent_assessment_views = this.getAssessments(agent)) {
		let view = agent_assessment_views.get(node.id);

		if(view === undefined) {
			view = new AssessmentView(agent, node, this._assessment_menu);
			agent_assessment_views.set(node.id, view);
		}
		return view;
	}

	
	// Get the JagCell from the analysis generic id-view map.  If not there, create it, map it, return it.
	getMappedJagCell(node) {
		let jagCell = this._idToTableCellMap.get(node.id);
		if(jagCell == undefined) {
			jagCell = new JagCell(node);
			this._idToTableCellMap.set(node.id, jagCell);
		}
		return jagCell;
	}

	attach({targetNode, reference = null, layout = true, select = true } = {}) {

		// Finds the element representing the table's bottom row (succession of youngest children)
		if(reference == null) {
			reference = this.findTableBottomNode(targetNode);
		}
		const $targetCell = this.getMappedJagCell(targetNode);
		const $referenceCell = this.getMappedJagCell(reference);
		this.insertBefore($targetCell, $referenceCell.nextSibling);
		if(select) {
			// Giving --> dom.js:32 addRange(): The given range isn't in document.
			this.selectElementNameText($targetCell);
		}
		if(layout) this.layout();
	}

	_handleAttach(e) {
		this.attach(e.detail);
	}

	detach({target, layout = true } = {}) {
		const $target = this.getMappedJagCell(target);
		this.removeChild($target);
		if(layout) this.layout();
	}

	_handleDetach(e) {
		this.detach(e.detail);
	}

	selectElementNameText(child) {
		DOMUtils.selectNodeText(child.nameElement);
	}

	/**
	 * Finds the activity on the bottom of the graph
	 * Gets the last child's last child's lasts child...  used for a reference when building view.
	 */
	findTableBottomNode(node) {
		while (node.hasChildren()) {
			node = node.getLastChild()
		}
		return node;
	}

	layout() {
		// level_count changes width of level 1's box
		// @TODO: Investigate changing that so the update only happens when necessary
		// and only on branches that need it.


		//this._analysisModel.rootNodeModel.update();  //@TODO - either break this in two functions: getNumOfLeaves(breadth) & getTreeDepth(height)



		// Resets the leaf set.
		this._leafArray.length = 0;

		let height = -1;
		let rows = 0;

		this._layoutJAG(this._analysisModel.rootNodeModel, AnalysisView.HEADER_DEPTH, 0);


		height = this._analysisModel.rootNodeModel.treeDepth;
		rows = this._analysisModel.rootNodeModel.leafCount;

		const level_count = height + 1;                                        //  this is the depth actually.
		const agent_count = this._layoutHeaders(level_count);


		this._layoutAssessments(level_count, AnalysisView.HEADER_DEPTH);
		this.style.setProperty('--jag-columns', level_count.toString());
		this.style.setProperty('--team-columns', agent_count.toString());
		this.style.setProperty('--rows', rows.toString());
	}


	// update(node = this) {
	// 	node._breadth = 1;    // number of leaves = height of table (skipping collapsed nodes)
	// 	node._height = 0;     // depth of tree  (skipping collapsed nodes)
	// 	console.log("? analysis xxx")
	// 	if(node.hasChildren() && !node._collapsed)
	// 	{
	// 		node._breadth = 0;
	// 		let max_height = 0;
	// 		this.children.forEach(child => {
	// 			child.update();
	// 			node._breadth += child.breadth;
	// 			max_height = Math.max(max_height, child.height);
	// 		})
	// 		node._height = max_height + 1;
	// 	}
	// }



	_initializeContextMenus() {
		this._assessment_menu = new ContextMenu();

		for(let assessment of AnalysisView.ASSESSMENTS) {
			const {color: rgb, label} = AssessmentView.ASSESSMENT_DESCRIPTIONS[assessment];
			const properties = {[AssessmentView.ASSESSMENT_SYMBOL]: assessment};
			const style = {'background-color': `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`};

			this._assessment_menu.addEntry(label, properties, style);
		}
	}

	_initializeStaticHeaders() {
		// Creates JAG section header.
		// That header does not need to be added to column headers map since it's static
		// and does not need to be updated (css takes care of its dynamic span thanks to named columns).
		const $jag_header = new ColumnHeader(AnalysisView.JAG_SECTION_HEADER_NAME, 0, 0, AnalysisView.JAG_SECTION_COLUMN_END)
		$jag_header.colSpanType = ColumnHeader.END;
		this.appendChild($jag_header);

		// Root header does not need to be updated ever.
		this.appendChild(new ColumnHeader(AnalysisView.JAG_SECTION_ROOT_HEADER_NAME, 0, 1));
	}

	// Prefix traversal. okay
	// For every node in tree - Attach it.  (Attach = put it in map)
	_initializeTree(node) {
		this.attach({
			targetNode: node,
			layout: false
		});
		node.children.forEach((child_node) => {
			this._initializeTree(child_node);
		});
	}

	_isNodeInTheLeafSet(node_id) {
		return this._leafArray.findIndex(leaf => leaf.id === node_id) !== -1;
	}

	_layoutAssessments(col, row) {
		const $assessments = document.createDocumentFragment();

		let offset = 0;
		const team = this._analysisModel.team;
		for(let agent of team.agents) {
			const assessments = this.getAssessments(agent);

			// Removes all assessment views that are not part of the current leaf set.
			for(let [node_id, $assessment] of assessments)
				if(!this._isNodeInTheLeafSet(node_id) && this.contains($assessment))
					this.removeChild($assessment);

			// Relayouts all assessment views for the current leaf set.
			for(let i = 0 ; i < this._leafArray.length ; i++) {
				const node = this._leafArray[i];
				const $assessment = this.getAssessmentView(agent, node, assessments);
				// Adds the current assessment view to the fragment if it is not already in the DOM.
				if(!this.contains($assessment))
					$assessments.appendChild($assessment);

				// Updates the layout
				$assessment.style.setProperty('--col-start', col + offset + 1);
				$assessment.style.setProperty('--row-start', row + i + 1);
			}
			offset++;
		}

		this.appendChild($assessments);
	}

	_layoutHeaders(level_count) {
		for(let header of this._columnHeaderMap.values())
			if(this.contains(header))
				this.removeChild(header);

		const $columns = document.createDocumentFragment();

		// Starts at 1 since the root header does not need to be updated and is never removed.
		for (let i = 1 ; i < level_count ; i++) {
			if(!this._columnHeaderMap.has(i))
				this._makeHeader(i, `Level ${i}`, i, 1);

			const $column = this._columnHeaderMap.get(i);
			$columns.appendChild($column);
		}

		let offset = 0;
		const team = this._analysisModel.team;
		const agent_count = team.agents.length;
		const abs_offset = level_count + offset;

		// Gets (and makes if necessary) the team header
		if(!this._columnHeaderMap.has(team.id))
			this._makeHeader(team.id, team.name, abs_offset, 0, agent_count);
		else
			this._columnHeaderMap.get(team.id).innerText = team.name;

		const $column = this._columnHeaderMap.get(team.id);
		$column.colStart = abs_offset;
		$columns.appendChild($column);

		for (let i = abs_offset, agent_idx = 0 ; i < abs_offset + agent_count; i++, agent_idx++) {
			const agent = team.agents[agent_idx];

			if (!this._columnHeaderMap.has(agent.id))
				this._makeHeader(agent.id, agent.name, i, 1);
			else
				this._columnHeaderMap.get(agent.id).innerText = agent.name;

			const $column = this._columnHeaderMap.get(agent.id);
			$column.colStart = i;
			$columns.appendChild($column);
		}
		offset += agent_count;

		this.appendChild($columns);

		return offset;
	}

	_layoutJAG(node, row, col) {
		const $view = this.getMappedJagCell(node);

		if(node.children.length !== 0 && !node.collapsed)
		{
			let local_row = row;
			this._showChildNodes(node, false);

			for(let child of node._children) {
				this._layoutJAG(child, local_row, col + 1);
				//local_row+= child.breadth;
				local_row+= child.leafCount;
			}

			$view.style.setProperty('--col-end', '1 span');
		} else {
			this._leafArray.push(node);
			this._hideChildNodes(node);
			$view.style.setProperty('--col-end', AnalysisView.JAG_SECTION_COLUMN_END);
			//$view.style.setProperty('--col-end', '1 span');
		}

		// Position the item properly
		$view.style.setProperty('--col-start', col + 1);
		$view.style.setProperty('--row-start', row + 1);
	//	$view.style.setProperty('--row-end', `${node.breadth} span`);
		$view.style.setProperty('--row-end', `${node.leafCount} span`);
	}

	_makeHeader(id, name, col, row, col_span, row_span) {
		this._columnHeaderMap.set(id, new ColumnHeader(name, col, row, col_span, row_span));
	}

	_showChildNodes(node, recurse = true) {
		for(let child of node.children) {
			const $view = this.getMappedJagCell(child);
			$view.show();

			if(recurse)
				this._showChildNodes(child);
		}
	}

	_hideChildNodes(node, recurse = true) {
		for(let child of node.children) {
			const $view = this.getMappedJagCell(child);
			$view.hide();

			if(recurse)
				this._hideChildNodes(child);
		}
	}




}

AnalysisView.JAG_SECTION_ROOT_HEADER_NAME = 'Root';
AnalysisView.JAG_SECTION_HEADER_NAME = 'JAG';
AnalysisView.JAG_SECTION_COLUMN_END = 'jag-column-end';

AnalysisView.HEADER_DEPTH = 2;

AnalysisView.ASSESSMENTS = [
	AgentModel.CAN_DO_PERFECTLY,
	AgentModel.CAN_DO,
	AgentModel.CAN_HELP,
	AgentModel.CANNOT_DO
];


customElements.define('ia-analysis', AnalysisView);
export default customElements.get('ia-analysis');

