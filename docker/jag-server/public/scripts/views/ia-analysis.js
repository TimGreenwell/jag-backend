/**
 * @fileOverview AnalysisModel view.
 *
 * @author mvignati
 * @version 2.50
 */

'use strict';

import AgentModel from '../models/agent.js';
import DOMUtils from '../utils/dom.js';
import ContextMenu from './ia-support/context-menu.js';
import ColumnHeader from './ia-support/column-header-cell.js';
import AssessmentView from './ia-support/assessment-cell.js';
import JagCell from './ia-support/jag-cell.js';

class AnalysisView extends HTMLElement {

    constructor(analysisModel, table) {
        super();
        this._analysisModel = analysisModel;
        this._columnHeaderMap = new Map();
        this._leafArray = [];
        this._$assessment_menu = undefined;
        this._idToTableCellMap = new Map();  // id to viewCell... looks like ids can be agents or nodes(activities)
        this._initializeContextMenus();
        this._initializeStaticHeaders();
        this._initializeTree(this._analysisModel.rootCellModel);
        this.layout();
        // //    await updatedAnalysis.buildAnalysisActivityNodes(rootCellModel);
    }

    get analysisModel() {
        return this._analysisModel;
    }

    set analysisModel(value) {
        this._analysisModel = value;
    }

    /**
     * Constructor Methods
     *
     * _initializeContextMenus
     * _initializeStaticHeaders
     * _initializeTree
     * layout
     *
     */

    _initializeContextMenus() {
        // @todo - once understood better and working -- put the assignment and AssessmentView constants into the ContextMenu constructor and class
        this._$assessment_menu = new ContextMenu();
        for (const assessment of AnalysisView.ASSESSMENTS) {
            const {color: rgb, label} = AssessmentView.ASSESSMENT_DESCRIPTIONS[assessment];
            const properties = {[AssessmentView.ASSESSMENT_SYMBOL]: assessment};
            const style = {'background-color': `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`};
            this._$assessment_menu.addEntry(label, properties, style);
        }
    }

    _initializeStaticHeaders() {
        // Creates JAG section header.
        // Does not need to be added to column headers -- static
        const $jag_header = new ColumnHeader(AnalysisView.JAG_SECTION_HEADER_NAME, 0, 0, AnalysisView.JAG_SECTION_COLUMN_END);
        $jag_header.colSpanType = ColumnHeader.END;
        this.appendChild($jag_header);
        // Root header does not need to be updated -- static.
        this.appendChild(new ColumnHeader(AnalysisView.JAG_SECTION_ROOT_HEADER_NAME, 0, 1));
    }

    _initializeTree(node, nodeParent = null) {
        // Prefix traversal. Required.  Reference is based on last child of last child...
        this.attach({
            targetNode: node,
            targetNodeParent: nodeParent,
            layout: false
        });
        node.children.forEach((child_node) => {
            this._initializeTree(child_node, node);
        });
    }

    layout() {
        // @TODO: Investigate changing that so the update only happens when necessary
        // and only on branches that need it.
        // Resets the leaf set.
        this._leafArray.length = 0;      // why
        let height = -1;                  // why
        let rows = 0;                    // why

        this._layoutJAG(this._analysisModel.rootCellModel, AnalysisView.HEADER_DEPTH, 0);
        this._removeHeaders(); // ?

        height = this._analysisModel.rootCellModel.treeDepth;
        rows = this._analysisModel.rootCellModel.leafCount;

        const jagColumns = height + 1;                                        //  this is the depth actually.
        const agentCount = this._layoutHeaders(jagColumns);

        this._layoutAssessments(jagColumns, AnalysisView.HEADER_DEPTH);
        this.style.setProperty(`--jag-columns`, jagColumns.toString());
        this.style.setProperty(`--team-columns`, agentCount.toString());
        this.style.setProperty(`--rows`, rows.toString());
    }

    _removeHeaders() {
        for (const header of this._columnHeaderMap.values()) {
            if (this.contains(header)) {
                this.removeChild(header);
            }
        }
    }

    _layoutHeaders(level_count) {
        const $columns = document.createDocumentFragment();
        // Starts at 1 since the root header does not need to be updated and is never removed.
        for (let i = 1; i < level_count; i++) {
            if (!this._columnHeaderMap.has(i)) {
                this._makeHeader(i, `Level ${i}`, i, 1);
            }
            const $column = this._columnHeaderMap.get(i);
            $columns.appendChild($column);
        }

        let offset = 0;
        const team = this._analysisModel.team;
        const agent_count = team.agentIds.length;
        const abs_offset = level_count + offset;

        // Gets (and makes if necessary) the team header
        if (this._columnHeaderMap.has(team.id)) {
            this._columnHeaderMap.get(team.id).innerText = team.name;
        } else {
            this._makeHeader(team.id, team.name, abs_offset, 0, agent_count);
        }

        const $column = this._columnHeaderMap.get(team.id);
        $column.colStart = abs_offset;
        $columns.appendChild($column);

        for (let i = abs_offset, agent_idx = 0; i < abs_offset + agent_count; i++, agent_idx++) {
            const agent = team.agents[agent_idx];

            if (this._columnHeaderMap.has(agent.id)) {
                this._columnHeaderMap.get(agent.id).innerText = agent.name;
            } else {
                this._makeHeader(agent.id, agent.name, i, 1);
            }

            const $column = this._columnHeaderMap.get(agent.id);
            $column.colStart = i;
            $columns.appendChild($column);
        }
        offset = offset + agent_count;
        this.appendChild($columns);
        return offset;
    }

    // If agent exists, get related assessment.  If not, create and return empty assessment.
    getAssessments(agent) {
        let agent_assessment_views = this._idToTableCellMap.get(agent.id);
        if (agent_assessment_views === undefined) {
            agent_assessment_views = new Map();
            this._idToTableCellMap.set(agent.id, agent_assessment_views);
        }
        return agent_assessment_views;
    }

    getAssessmentView(agent, node, agent_assessment_views = this.getAssessments(agent)) {
        let view = agent_assessment_views.get(node.id);

        if (view === undefined) {
            view = new AssessmentView(agent, node, this._$assessment_menu);
            agent_assessment_views.set(node.id, view);
        }
        return view;
    }

    // Get (orCreate) the JagCell from the analysis generic id-view map.  If not there, create it, map it, return it.
    getMappedActivityCell(cellModel, parent) {
        let jagCell = this._idToTableCellMap.get(cellModel.id);
        if (jagCell == undefined) {
            jagCell = new JagCell(cellModel, parent);
            this._idToTableCellMap.set(cellModel.id, jagCell);
        }
        return jagCell;
    }

    attach({targetCellModel, targetNodeParent, reference = null, layout = true, select = true} = {}) {
        // When would there ever be a different 'reference'
        // Ideally, layout only on last call.
        // select isnt working.. range error.
        // @todo looks unlikely we need reference and select as parameters.. noone uses it.  Layout looks suspect too.

        // Finds the element representing the table's bottom row (succession of youngest children)
        if (reference == null) {
            reference = this.findTableBottomNode(targetCellModel);
        }
        const $targetCell = this.getMappedActivityCell(targetCellModel, targetNodeParent);
        const $referenceCell = this.getMappedActivityCell(reference);
        this.insertBefore($targetCell, $referenceCell.nextSibling);
        if (select) {
            // Giving --> dom.js:32 addRange(): The given range isn't in document.
            this.selectElementNameText($targetCell);
        }
        if (layout) {
            this.layout();
        }
    }

    // _handleAttach(e) {
    //     this.attach(e.detail);
    // }

    detach({target, layout = true} = {}) {
        const $target = this.getMappedActivityCell(target);
        this.removeChild($target);
        if (layout) {
            this.layout();
        }
    }

    _handleDetach(e) {
        this.detach(e.detail);
    }

    selectElementNameText(child) {              // called once by attach - and that gives an error @todo
        DOMUtils.selectNodeText(child.nameElement);    // @TODO - vague node reference - find a rename
    }

    /**
     * Finds the activity on the bottom of the graph
     * Gets the last child's last child's lasts child...  used for a reference when building view.
     */
    findTableBottomNode(node) {
        while (node.hasChildren()) {
            node = node.getLastChild();
        }
        return node;
    }

    _isNodeInTheLeafSet(node_id) {
        return this._leafArray.findIndex((leaf) => {
            return leaf.id === node_id;
        }) !== -1;
    }

    _layoutAssessments(col, row) {
        const $assessments = document.createDocumentFragment();

        let offset = 0;
        const team = this._analysisModel.team;
        for (const agent of team.agents) {
            const assessments = this.getAssessments(agent);

            // Removes all assessment views that are not part of the current leaf set.
            for (const [node_id, $assessment] of assessments) {
                if (!this._isNodeInTheLeafSet(node_id) && this.contains($assessment)) {
                    this.removeChild($assessment);
                }
            }

            // Relayouts all assessment views for the current leaf set.
            for (let i = 0; i < this._leafArray.length; i++) {
                const node = this._leafArray[i];
                const $assessment = this.getAssessmentView(agent, node, assessments);
                // Adds the current assessment view to the fragment if it is not already in the DOM.
                if (!this.contains($assessment)) {
                    $assessments.appendChild($assessment);
                }

                // Updates the layout
                $assessment.style.setProperty(`--col-start`, col + offset + 1);
                $assessment.style.setProperty(`--row-start`, row + i + 1);
            }
            offset = offset + 1;
        }

        this.appendChild($assessments);
    }


    _layoutJAG(cellModel, row, col) {
        const $view = this.getMappedActivityCell(cellModel);

        if (cellModel.hasChildren() && !cellModel.collapsed) {
            let local_row = row;
            this._showChildNodes(cellModel, false);

            for (const child of cellModel._children) {
                this._layoutJAG(child, local_row, col + 1);
                local_row = local_row + child.leafCount;
            }

            $view.style.setProperty(`--col-end`, `1 span`);
        } else {
            this._leafArray.push(cellModel);
            this._hideChildNodes(cellModel);
            $view.style.setProperty(`--col-end`, AnalysisView.JAG_SECTION_COLUMN_END);
            // $view.style.setProperty('--col-end', '1 span');
        }

        // Position the item properly
        $view.style.setProperty(`--col-start`, col + 1);
        $view.style.setProperty(`--row-start`, row + 1);
        $view.style.setProperty(`--row-end`, `${cellModel.leafCount} span`);
    }

    _makeHeader(id, name, col, row, col_span, row_span) {
        this._columnHeaderMap.set(id, new ColumnHeader(name, col, row, col_span, row_span));
    }

    _showChildNodes(cellModel, recurse = true) {
        for (const childCell of cellModel.children) {
            const $view = this.getMappedActivityCell(childCell);
            $view.show();

            if (recurse) {
                this._showChildNodes(childCell);
            }
        }
    }

    _hideChildNodes(cellModel, recurse = true) {
        for (const childCell of cellModel.children) {
            const $view = this.getMappedActivityCell(childCell);
            $view.hide();

            if (recurse) {
                this._hideChildNodes(childCell);
            }
        }
    }


}

AnalysisView.JAG_SECTION_ROOT_HEADER_NAME = `Root`;
AnalysisView.JAG_SECTION_HEADER_NAME = `JAG`;
AnalysisView.JAG_SECTION_COLUMN_END = `jag-column-end`;

AnalysisView.HEADER_DEPTH = 2;

AnalysisView.ASSESSMENTS = [
    AgentModel.CAN_DO_PERFECTLY,
    AgentModel.CAN_DO,
    AgentModel.CAN_HELP,
    AgentModel.CANNOT_DO
];


customElements.define(`ia-analysis`, AnalysisView);
export default customElements.get(`ia-analysis`);

