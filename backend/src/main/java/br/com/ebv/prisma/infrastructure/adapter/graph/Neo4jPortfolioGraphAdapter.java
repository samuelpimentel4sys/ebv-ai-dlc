package br.com.ebv.prisma.infrastructure.adapter.graph;

import br.com.ebv.prisma.domain.portfolio.port.out.PortfolioGraphStorePort;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.neo4j.driver.Values;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@ConditionalOnProperty(name = "prisma.graph.backend", havingValue = "neo4j")
public class Neo4jPortfolioGraphAdapter implements PortfolioGraphStorePort {

    private static final Logger log = LoggerFactory.getLogger(Neo4jPortfolioGraphAdapter.class);

    private final Driver driver;

    public Neo4jPortfolioGraphAdapter(Driver driver) {
        this.driver = driver;
    }

    @Override
    public boolean live() {
        try (Session session = driver.session()) {
            session.run("RETURN 1").consume();
            return true;
        } catch (Exception e) {
            log.warn("Neo4j ping falhou: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public void ensureLabSeed() {
        try (Session session = driver.session()) {
            long count = session.run("MATCH (n:PortfolioNode) RETURN count(n) AS c")
                    .single().get("c").asLong();
            if (count > 0) {
                return;
            }
            session.executeWrite(tx -> {
                tx.run("""
                        CREATE (a:PortfolioNode {
                          id: 'n-1001', exposure: 1250000.50, rating: 'C', score: 612,
                          x: 0.12, y: 0.44, risk: 0.08
                        })
                        CREATE (b:PortfolioNode {
                          id: 'n-2044', exposure: 890000.0, rating: 'B', score: 701,
                          x: 0.33, y: 0.21, risk: 0.15
                        })
                        CREATE (a)-[:LINK {weight: 0.37, type: 'FORNECEDOR'}]->(b)
                        """);
                return null;
            });
            log.info("Neo4j lab seed criado (2 nós + 1 aresta)");
        } catch (Exception e) {
            log.warn("Neo4j seed falhou: {}", e.getMessage());
        }
    }

    @Override
    public GraphSnapshot loadGraph(int maxNodes) {
        ensureLabSeed();
        int limit = Math.max(1, maxNodes);
        try (Session session = driver.session()) {
            List<Node> nodes = new ArrayList<>();
            session.run("""
                    MATCH (n:PortfolioNode)
                    RETURN n.id AS id, n.exposure AS exposure, n.rating AS rating, n.score AS score,
                           n.x AS x, n.y AS y, n.risk AS risk
                    LIMIT $limit
                    """, Values.parameters("limit", limit))
                    .forEachRemaining(rec -> nodes.add(new Node(
                            rec.get("id").asString(),
                            rec.get("exposure").asDouble(0),
                            rec.get("rating").asString("C"),
                            rec.get("score").asInt(0),
                            rec.get("x").asDouble(0),
                            rec.get("y").asDouble(0),
                            rec.get("risk").asDouble(0)
                    )));

            List<Edge> edges = new ArrayList<>();
            session.run("""
                    MATCH (a:PortfolioNode)-[r:LINK]->(b:PortfolioNode)
                    WHERE a.id IN $ids AND b.id IN $ids
                    RETURN a.id AS frm, b.id AS too, r.weight AS weight, r.type AS type
                    """, Values.parameters("ids", nodes.stream().map(Node::id).toList()))
                    .forEachRemaining(rec -> edges.add(new Edge(
                            rec.get("frm").asString(),
                            rec.get("too").asString(),
                            rec.get("weight").asDouble(0),
                            rec.get("type").asString("LINK")
                    )));

            long total = session.run("MATCH (n:PortfolioNode) RETURN count(n) AS c")
                    .single().get("c").asLong();
            return new GraphSnapshot(nodes, edges, total > nodes.size());
        } catch (Exception e) {
            log.warn("Neo4j loadGraph falhou: {} — empty", e.getMessage());
            return new GraphSnapshot(List.of(), List.of(), false);
        }
    }
}
