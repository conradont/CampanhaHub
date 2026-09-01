def safe_div(numerator: float, denominator: float) -> float | None:
    if denominator in (0, None):
        return None
    return round(numerator / denominator, 4)


def calc_cpc(investimento: float, cliques: int) -> float | None:
    value = safe_div(investimento, cliques)
    return round(value, 4) if value is not None else None


def calc_ctr(cliques: int, impressoes: int) -> float | None:
    value = safe_div(cliques * 100, impressoes)
    return round(value, 2) if value is not None else None


def calc_taxa_conversao(conversoes: int, cliques: int) -> float | None:
    value = safe_div(conversoes * 100, cliques)
    return round(value, 2) if value is not None else None


def calc_cpm(investimento: float, impressoes: int) -> float | None:
    value = safe_div(investimento * 1000, impressoes)
    return round(value, 4) if value is not None else None


def calc_engajamento(curtidas: int, comentarios: int, compartilhamentos: int, alcance: int) -> float | None:
    value = safe_div((curtidas + comentarios + compartilhamentos) * 100, alcance)
    return round(value, 2) if value is not None else None


def build_indicators(
    investimento: float,
    cliques: int,
    impressoes: int,
    conversoes: int,
    curtidas: int = 0,
    comentarios: int = 0,
    compartilhamentos: int = 0,
    alcance: int = 0,
) -> dict:
    return {
        "cpc": calc_cpc(investimento, cliques),
        "ctr": calc_ctr(cliques, impressoes),
        "taxa_conversao": calc_taxa_conversao(conversoes, cliques),
        "cpm": calc_cpm(investimento, impressoes),
        "taxa_engajamento": calc_engajamento(curtidas, comentarios, compartilhamentos, alcance),
    }
