/**
 * @file Agent and team editor panel for IA.
 *
 * @author cwilber
 * @copyright Copyright © 2020 IHMC, all rights reserved.
 * @version 0.45
 */

import AgentModel from '../models/agent.js';
import FormUtils from '../utils/forms.js';

customElements.define(`ia-properties`, class extends HTMLElement {

    constructor(controller) {
        super();
        this._controller = controller;
        this._team = undefined;
        this._agent = undefined;
        this._initUI();
        this._initHandlers();

        this._boundUpdate = this._updateProperties.bind(this);
        this._boundAgentUpdate = this._updateAgentProperties.bind(this);
        this._boundTeamUpdate = this._updateTeamProperties.bind(this);
    }

    set agent(agent) {
        if (this._agent) {
            this._agent.removeEventListener(`update`, this._boundUpdate);
            this._agent = undefined;
        }

        this._clearAgentProperties();

        if (agent) {
            this._agent = agent;
            this._agent.addEventListener(`update`, this._boundUpdate);
        }

        this._updateAgentProperties();
    }

    set team(team) {
        if (this._team) {
            this._team.removeEventListener(`update`, this._boundTeamUpdate);
            this._team = undefined;

            if (this._agent) {
                this._agent.removeEventListener(`update`, this._boundUpdate);
                this._agent = undefined;
            }
        }

        this._clearProperties();

        if (team) {
            this._team = team;
            this._team.addEventListener(`update`, this._boundTeamUpdate);
        }

        this._updateTeamProperties();
        this._enableAgentProperties(false);
    }

    _updateProperties() {
        this._updateTeamProperties();
        this._updateAgentProperties();
    }

    _updateTeamProperties() {
        this._enableTeamProperties(this._team !== undefined);

        if (this._team) {
            this._team_name.value = this._team.name;

            this._clearAgentList();
            for (const agent of this._team.agents) {
                const agent_option = document.createElement(`option`);
                agent_option.setAttribute(`value`, agent.id);
                agent_option.innerText = agent.name;
                this._team_agents.appendChild(agent_option);
            }
        }
    }

    _updateAgentProperties() {
        this._enableAgentProperties(this._team !== undefined && this._agent !== undefined);

        if (this._team && this._agent) {
            this._agent_name.value = this._agent.name;
            this._agent_performer.checked = this._team.performer(this._agent.id);
        }
    }

    _initUI() {
        const teamName_el = FormUtils.createPropertyElement(`team-name`, `Team Name`);
        this._team_name = FormUtils.createTextInput(`team-name`);
        teamName_el.appendChild(this._team_name);

        const teamAgents_el = FormUtils.createPropertyElement(`team-agents`, `Team Agents`);

        this._team_agents = FormUtils.createSelect(`team-agents`, []);
        this._team_agents.setAttribute(`size`, `4`);
        teamAgents_el.appendChild(this._team_agents);

        this._remove_agent = document.createElement(`button`);
        this._remove_agent.innerText = `Remove Agent`;
        this._remove_agent.addEventListener(`click`, (e) => {
            this.dispatchEvent(new CustomEvent(`event-agent-removed`, {
                bubbles: true,
                composed: true,
                detail: {removedAgent: this._team_agents.value}
            }));
            this._remove_agent.disabled = true;
        });
        this._remove_agent.disabled = true;
        teamAgents_el.appendChild(this._remove_agent);

        const agentName_el = FormUtils.createPropertyElement(`agent-name`, `Agent Name`);
        this._agent_name = FormUtils.createTextInput(`agent-name`);
        agentName_el.appendChild(this._agent_name);

        const agentRole_el = FormUtils.createPropertyElement(`agent-role`, `Agent Role`);
        const agentPerformer_el = document.createElement(`div`);
        this._agent_performer = document.createElement(`input`);
        this._agent_performer.setAttribute(`type`, `checkbox`);
        this._agent_performer.setAttribute(`id`, `agent-performer`);
        const agent_performer_label = document.createElement(`label`);
        agent_performer_label.setAttribute(`for`, `agent-performer`);
        agent_performer_label.innerText = `Performer Capable`;
        agentPerformer_el.appendChild(this._agent_performer);
        agentPerformer_el.appendChild(agent_performer_label);
        agentRole_el.appendChild(agentPerformer_el);

        this._enableTeamProperties(false);
        this._enableAgentProperties(false);

        this.appendChild(teamName_el);
        this.appendChild(teamAgents_el);
        this.appendChild(agentName_el);
        this.appendChild(agentRole_el);
    }

    _initHandlers() {
        this._team_name.addEventListener(`blur`, (e) => {
            this._team.name = e.target.value;
        });

        this._team_agents.addEventListener(`change`, (e) => {
            this._remove_agent.disabled = false;
            for (const agent of this._team.agents) {
                if (agent.id === e.target.value) {
                    this.agent = agent;
                    return;
                }
            }
        });


        this._agent_name.addEventListener(`blur`, (e) => {
            this._agent.name = e.target.value;
        });

        this._agent_performer.addEventListener(`change`, (e) => {
            this._team.setPerformer(this._agent.id, e.target.checked);
        });
    }

    _clearProperties() {
        this._team_name.value = ``;
        this._clearAgentList();
        this._clearAgentProperties();
    }

    _clearAgentList() {
        while (this._team_agents.firstChild) {
            this._team_agents.removeChild(this._team_agents.firstChild);
        }
    }

    _clearAgentProperties() {
        this._agent_name.value = ``;
        this._agent_performer.checked = false;
    }

    _enableTeamProperties(enabled) {
        this._team_name.disabled = !enabled;
        //    this._remove_agent.disabled = !enabled;
    }

    _enableAgentProperties(enabled) {
        this._agent_name.disabled = !enabled;
        this._agent_performer.disabled = !enabled;
    }

});

export default customElements.get(`ia-properties`);
