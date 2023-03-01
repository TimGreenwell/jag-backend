/**
 * @fileOverview Team member assessment view for a given pseudo leaf (real or collapsed).
 *
 * @author mvignati
 * @version 0.76
 */

'use strict';

import {uuidV4} from '../../utils/uuid.js';

import AgentModel from '../../models/agent.js';
import ContextMenu from './context-menu.js';
import AnalysisCell from './analysis-cell.js';

class AssessmentView extends AnalysisCell {

    constructor(agent, node, context_menu) {
        super(context_menu);
        this._id = uuidV4();
        this._agent = agent;
        this._node = node;

        this._init();
    }

    get id() {
        return this._id;
    }

    _init() {
        this._setFillColorToAssessmentValue(this._agent.assessment(this._node));
        // this._agent.addEventListener(`update`, this._handleAgentUpdate.bind(this));
        this.addEventListener(`contextmenu`, (_) => {
            this.addContextMenuListener(ContextMenu.SELECT_EVENT, this._processContextMenuChoice.bind(this));
        });
    }

    _handleAgentUpdate(e) {
        if (e.detail.property === `assessment`) {
            const {urn, assessment} = e.detail.extra;
            if (urn === this._node.urn) {
                this._setAssessment(assessment);
            }
        }
    }

    _processContextMenuChoice(event) {
        const result = event.detail[AssessmentView.ASSESSMENT_SYMBOL];
        this._agent.setAssessment(this._node.urn, result);
    }

    _setFillColorToAssessmentValue(assessment) {
        if (assessment === undefined) {
            return;
        }

        const description = AssessmentView.ASSESSMENT_DESCRIPTIONS[assessment];
        const rgb = description.color;
        if (rgb !== undefined) {
            const color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            this.style.setProperty(`background-color`, color);
        }
    }

    _handleMouseUp(event) {
        this.parentNode.removeChild(this);
        this.callback(event.target[AssessmentView.ASSESSMENT_SYMBOL]);
    }

}

AssessmentView.ASSESSMENT_SYMBOL = Symbol(`assessment`);

AssessmentView.ASSESSMENT_DESCRIPTIONS = {
    [AgentModel.CAN_DO_PERFECTLY]: {
        color: [153, 255, 153],
        label: `Can do perfectly`
    },
    [AgentModel.CAN_DO]: {
        color: [255, 255, 120],
        label: `Can do`
    },
    [AgentModel.CAN_HELP]: {
        color: [255, 200, 100],
        label: `Can help`
    },
    [AgentModel.CANNOT_DO]: {
        color: [255, 110, 110],
        label: `Cannot do`
    }
};


customElements.define(`ia-assessment`, AssessmentView);
export default customElements.get(`ia-assessment`);

