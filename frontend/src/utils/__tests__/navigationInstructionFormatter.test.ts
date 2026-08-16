import { formatWalkingInstruction } from '../navigationInstructionFormatter';

describe('navigationInstructionFormatter', () => {
  it('deve retornar default se instrucao for vazia', () => {
    const result = formatWalkingInstruction({ rawInstruction: '' });
    expect(result.displayTitle).toBe('Siga pelo caminho');
    expect(result.displaySubtitle).toBe('Até o próximo passo');
  });

  it('deve retornar default com distancia se instrucao for vazia mas tiver distancia', () => {
    const result = formatWalkingInstruction({ rawInstruction: '', distanceMeters: 150 });
    expect(result.displaySubtitle).toBe('150 m');
  });

  it('deve alertar sobre uso restrito', () => {
    const result = formatWalkingInstruction({ rawInstruction: 'Siga em frente (Via de uso restrito)' });
    expect(result.warning).toBe('Verifique o acesso');
    expect(result.displayTitle).toBe('Siga em frente');
  });

  it('deve remover direcoes relativas do google', () => {
    const result = formatWalkingInstruction({ rawInstruction: 'Siga na direção norte na R. ABC' });
    expect(result.displayTitle).toBe('Siga pela Rua ABC');
  });

  it('deve tratar ruas sem o verbo siga, colocando Siga pela', () => {
    const result = formatWalkingInstruction({ rawInstruction: 'Rua das Flores' });
    expect(result.displayTitle).toBe('Siga pela Rua das Flores');
  });

  it('deve formatar km corretamente', () => {
    const result = formatWalkingInstruction({ rawInstruction: 'Vire à direita', distanceMeters: 1500 });
    expect(result.displaySubtitle).toBe('1,5 km');
    expect(result.speechText).toBe('Em 1,5 quilômetros, Vire à direita.');
  });

  it('deve gerar texto de fala de Siga colocando distancia no final', () => {
    const result = formatWalkingInstruction({ rawInstruction: 'Siga em frente', distanceMeters: 200 });
    expect(result.speechText).toBe('Siga em frente por 200 metros.');
  });
});
