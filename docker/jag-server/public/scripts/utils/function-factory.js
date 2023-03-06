/**
 * @file UUID utils.
 *
 * @author Noodep
 * @version 0.06
 */

export function functionFactory(returns, operator) {
    let parameters = null;
    if (returns === `node.returns.available`) {
        parameters = `\${availableChildren}`;
    } else if (returns === `node.returns.all`) {
        parameters = `\${allChildren}`;
    } else if (returns === `node.returns.latest`) {
        parameters = `\${latestChild}`;
    } else if (returns === `node.returns.priority`) {
        parameters = `\${priorityChild}`;
    } else if (returns === `node.returns.final`) {
        parameters = `\${finalChild}`;
    }

    let returnFunction = null;
    if (operator === `node.operator.none`) {
        returnFunction = `${parameters}`;
    } else if (operator === `node.operator.and`) {
        returnFunction = `and(${parameters}) `;
    } else if (operator === `node.operator.or`) {
        returnFunction = `or(${parameters})`;
    } else if (operator === `node.operator.first`) {
        returnFunction = `pop([${parameters}])`;
    } else if (operator === `node.operator.last`) {
        returnFunction = `shift( ${parameters} )`;
    } else if (operator === `node.operator.max`) {
        returnFunction = `max(${parameters}) `;
    } else if (operator === `node.operator.min`) {
        returnFunction = `min(${parameters})`;
    } else if (operator === `node.operator.sum`) {
        returnFunction = `sum(${parameters})`;
    } else if (operator === `node.operator.avg`) {
        returnFunction = `avg(${parameters})`;
    } else if (operator === `node.operator.union`) {
        returnFunction = `union(${parameters})`;
    } else if (operator === `node.operator.intersection`) {
        returnFunction = `int(${parameters})`;
    } else if (operator === `node.operator.convert`) {
        returnFunction = `convert(${parameters}, $conversionFn)`;
    } else if (operator === `node.operator.inverse`) {
        returnFunction = `inv(${parameters})`;
    } else if (operator === `node.operator.negate`) {
        returnFunction = `neg(${parameters})`;
    } else if (operator === `node.operator.abs`) {
        returnFunction = `abs(${parameters})`;
    } else if (operator === `node.operator.not`) {
        returnFunction = `not(${parameters})`;
    }
    returnFunction = `ASSIGN( \${returnValue} , ${returnFunction} )`;
    return returnFunction;
}
