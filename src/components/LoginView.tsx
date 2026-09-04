import React, { useState } from 'react';
import { useOficina } from '../context/OficinaContext';
import type { UserRole } from '../types';
import { AppHeader } from './AppHeader';
import { Campo, inputClass } from './Campo';

export const LoginView: React.FC = () => {
  const { entrar, cadastrar } = useOficina();
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [papel, setPapel] = useState<UserRole>('mecanico');
  const [erro, setErro] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setInfo('');
    setBusy(true);
    try {
      if (modo === 'entrar') {
        await entrar(email.trim(), senha);
      } else {
        const msg = await cadastrar({
          email: email.trim(),
          senha,
          nome: nome.trim(),
          papel,
        });
        if (msg) setInfo(msg);
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Falha no login');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F7F7F8]">
      <AppHeader />
      <div className="max-w-sm mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold text-neutral-900">D&S Auto Center</h1>
        <p className="text-sm text-neutral-500 mt-1">Dois sócios. Uma OS. No celular.</p>

        <form onSubmit={submit} className="mt-8 space-y-3">
          {modo === 'criar' && (
            <>
              <Campo label="Seu nome">
                <input
                  className={inputClass}
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </Campo>
              <div>
                <p className="text-xs font-medium text-neutral-600 mb-1">Papel</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPapel('mecanico')}
                    className={`py-3 rounded-xl text-sm font-medium border ${
                      papel === 'mecanico'
                        ? 'bg-[#cd3f00] text-white border-[#cd3f00]'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    Mecânico
                  </button>
                  <button
                    type="button"
                    onClick={() => setPapel('vendedor')}
                    className={`py-3 rounded-xl text-sm font-medium border ${
                      papel === 'vendedor'
                        ? 'bg-[#cd3f00] text-white border-[#cd3f00]'
                        : 'bg-white text-neutral-700 border-neutral-200'
                    }`}
                  >
                    Vendedor
                  </button>
                </div>
              </div>
            </>
          )}
          <Campo label="E-mail">
            <input
              className={inputClass}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Campo>
          <Campo label="Senha">
            <input
              className={inputClass}
              type="password"
              autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
            />
          </Campo>
          {erro && <p className="text-sm text-red-700">{erro}</p>}
          {info && <p className="text-sm text-emerald-700">{info}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-[#cd3f00] text-white font-semibold text-base disabled:opacity-60"
          >
            {busy ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 text-sm text-neutral-600 underline"
          onClick={() => {
            setModo(modo === 'entrar' ? 'criar' : 'entrar');
            setErro('');
            setInfo('');
          }}
        >
          {modo === 'entrar' ? 'Primeiro acesso? Criar conta' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  );
};
