from utils.text_processing import sid, parse_location_city_detail, _combine_probs
from scoring.skill_variants import extract_skills_probabilistic, add_skillraw_nodes_and_links
from kg.graph_init import add_node, add_edge

def build_user_node(G, cv_text):
    """Build user node from CV"""
    USER_ID = "user::cv_001"
    G.add_node(USER_ID, ntype="User", label="CV_User_001")

    user_prob_raw, user_hits = extract_skills_probabilistic(cv_text)
    user_city, user_detail = parse_location_city_detail(cv_text)

    user_raw2can_map, user_raw2can_best = add_skillraw_nodes_and_links(
        G, USER_ID, cv_text, owner_rel_raw="HAS_SKILL_RAW"
    )

    p_from_raw_user = {}
    if user_raw2can_map:
        for r, vals in user_raw2can_map.items():
            for c, p in vals:
                if c not in p_from_raw_user:
                    p_from_raw_user[c] = []
                p_from_raw_user[c].append(p)
        p_from_raw_user = {k: _combine_probs(vs) for k, vs in p_from_raw_user.items()}

    user_prob = dict(user_prob_raw)
    for sk, p_raw in p_from_raw_user.items():
        prev = user_prob.get(sk, 0.0)
        user_prob[sk] = round(_combine_probs([prev, p_raw]), 3)

    for sk, p in user_prob.items():
        sk_n = f"skill::{sid('skill', sk)}"
        G.add_node(sk_n, ntype="Skill", label=sk)
        G.add_edge(USER_ID, sk_n, rel="HAS_SKILL", prob=round(p, 3))

    u_loc_n = f"loc::{sid('loc', user_city)}"
    G.add_node(u_loc_n, ntype="Location", label=user_city)
    G.add_edge(USER_ID, u_loc_n, rel="LOCATED_IN", level="city")
    
    return USER_ID, user_prob, user_city, user_detail, user_raw2can_map, user_raw2can_best

def build_strict_user_job_graph(G, user_node, topk=3):
    """Build a focused subgraph containing user, top-k jobs, and their attributes."""
    keep = {user_node}

    # Get top-k jobs
    jobs = [
        v for u, v, d in G.edges(data=True)
        if u == user_node and d.get("rel") == "MATCHES_JOB"
    ]
    jobs = sorted(
        jobs,
        key=lambda j: G.edges[user_node, j].get("score", 0),
        reverse=True
    )[:topk]

    keep.update(jobs)

    # Add user's attributes
    for _, v, d in G.edges(user_node, data=True):
        if d.get("rel") in ["HAS_SKILL", "LOCATED_IN"]:
            keep.add(v)

    # Add job attributes
    for j in jobs:
        for _, v, d in G.edges(j, data=True):
            if d.get("rel") in [
                "REQUIRES_SKILL",
                "LOCATED_IN",
                "HAS_SALARY_BUCKET",
                "REQUIRES_EXP_BUCKET",
                "HAS_ROLE_CANONICAL",
                "POSTED_BY"
            ]:
                keep.add(v)

    # Add SIMILAR_TO relationships between jobs
    for i, j1 in enumerate(jobs):
        for j2 in jobs[i+1:]:
            if G.has_edge(j1, j2):
                pass  # Already included in subgraph edges
            elif G.has_edge(j2, j1):
                pass  # Already included in subgraph edges

    return G.subgraph(keep).copy()