/**
 * @file UUID utils.
 *
 * @author Noodep
 * @version 0.06
 */

export function functionFactory(returns, operator) {
    let parameters = null;
    if (returns === `liveNode.returns.available`) {
        parameters = `\${availableChildren}`;
    } else if (returns === `liveNode.returns.all`) {
        parameters = `\${allChildren}`;
    } else if (returns === `liveNode.returns.latest`) {
        parameters = `\${latestChild}`;
    } else if (returns === `liveNode.returns.priority`) {
        parameters = `\${priorityChild}`;
    } else if (returns === `liveNode.returns.final`) {
        parameters = `\${finalChild}`;
    }

    let returnFunction = null;
    if (operator === `liveNode.operator.none`) {
        returnFunction = `${parameters}`;
    } else if (operator === `liveNode.operator.and`) {
        returnFunction = `and(${parameters}) `;
    } else if (operator === `liveNode.operator.or`) {
        returnFunction = `or(${parameters})`;
    } else if (operator === `liveNode.operator.first`) {
        returnFunction = `pop([${parameters}])`;
    } else if (operator === `liveNode.operator.last`) {
        returnFunction = `shift( ${parameters} )`;
    } else if (operator === `liveNode.operator.max`) {
        returnFunction = `max(${parameters}) `;
    } else if (operator === `liveNode.operator.min`) {
        returnFunction = `min(${parameters})`;
    } else if (operator === `liveNode.operator.sum`) {
        returnFunction = `sum(${parameters})`;
    } else if (operator === `liveNode.operator.avg`) {
        returnFunction = `avg(${parameters})`;
    } else if (operator === `liveNode.operator.union`) {
        returnFunction = `union(${parameters})`;
    } else if (operator === `liveNode.operator.intersection`) {
        returnFunction = `int(${parameters})`;
    } else if (operator === `liveNode.operator.convert`) {
        returnFunction = `convert(${parameters}, $conversionFn)`;
    } else if (operator === `liveNode.operator.inverse`) {
        returnFunction = `inv(${parameters})`;
    } else if (operator === `liveNode.operator.negate`) {
        returnFunction = `neg(${parameters})`;
    } else if (operator === `liveNode.operator.abs`) {
        returnFunction = `abs(${parameters})`;
    } else if (operator === `liveNode.operator.not`) {
        returnFunction = `not(${parameters})`;
    }
    returnFunction = `ASSIGN( \${returnValue} , ${returnFunction} )`;
    return returnFunction;
}
