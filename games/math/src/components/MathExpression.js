import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const MathContainer = styled.span`
  display: inline-block;
  font-size: 1.2em;
  min-height: 1.5em;
  vertical-align: middle;
`;

const MathExpression = ({ expression, inline = true }) => {
  const ref = useRef();

  useEffect(() => {
    if (!window.MathJax || !ref.current) return;
    ref.current.innerHTML = '';

    const hasLatex = /[\\^{}_]|\\frac|\\sqrt|\\times|\\div|\\%|\\text/.test(expression);
    let tex = expression;

    if (!hasLatex) {
      tex = expression.replace(/(\d+)\^(\d+)/g, '$1^{$2}').replace(/√(\d+)/g, '\\sqrt{$1}');
    }

    ref.current.innerHTML = inline ? `$${tex}$` : `$$${tex}$$`;
    window.MathJax.typesetPromise([ref.current]).catch(() => {});
  }, [expression, inline]);

  return <MathContainer ref={ref} />;
};

export default MathExpression;
